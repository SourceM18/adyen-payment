import {useCallback, useEffect, useMemo, useState} from 'react';
import {useApolloClient, useMutation, useQuery} from '@apollo/client';
import mergeOperations from '@magento/peregrine/lib/util/shallowMerge';

import { useCartContext } from '@magento/peregrine/lib/context/cart';

import DEFAULT_OPERATIONS from 'src/overrides/peregrine/talons/CheckoutPage/PaymentInformation/paymentMethods.gql';
import { useGoogleReCaptcha } from '@magento/peregrine/lib/hooks/useGoogleReCaptcha';
import {useFormApi, useFormState} from "informed";

const getRegion = region => {
    return region.region_id || region.label || region.code;
};

export const mapAddressData = rawAddressData => {
    if (rawAddressData) {
        const {
            firstName,
            lastName,
            city,
            postcode,
            phoneNumber,
            street,
            country,
            region
        } = rawAddressData;

        return {
            firstName,
            lastName,
            city,
            postcode,
            phoneNumber,
            street1: street[0],
            street2: street[1] || '',
            country: country.code,
            region: getRegion(region)
        };
    } else {
        return {};
    }
};

export const useAdyen = props => {
    const {
        onSuccess,
        onReady,
        onError,
        resetShouldSubmit,
        shouldSubmit
    } = props;

    const operations = mergeOperations(DEFAULT_OPERATIONS, props.operations);

    const {
        getAdyenPaymentNonceQuery,
        getAdyenPaymentQuery,
        setAdyenInformationMutation,
        getShippingAddressQuery,
        setBillingAddressMutation,
        getBillingAddressQuery,
        getIsBillingAddressSameQuery,
    } = operations;
    const [{ cartId }] = useCartContext();
    const {
        recaptchaLoading,
        recaptchaWidgetProps
    } = useGoogleReCaptcha({
        currentForm: 'ADYEN',
        formAction: 'adyen_cc'
    });

    const { data: adyenData, loading: adyenLoading } =useQuery(getAdyenPaymentQuery, {
        skip: !cartId,
        variables: { cartId }
    })

    const setAdyenPaymentInformation = useMutation(setAdyenInformationMutation, {
        skip: !cartId,
        variables: { cartId }
    })
    const [isAdyenLoading, setAdyenLoading] = useState(true);
    const [shouldRequestPaymentNonce, setShouldRequestPaymentNonce] = useState(
        false
    );
    const [shouldTeardownDropin, setShouldTeardownDropin] = useState(false);


    const [stepNumber, setStepNumber] = useState(0);

    const client = useApolloClient();
    const formState = useFormState();
    const { validate: validateBillingAddressForm } = useFormApi();

    const isLoading =
        isAdyenLoading ||
        recaptchaLoading ||
        (stepNumber >= 1 && stepNumber <= 3);

    const [
        setAdyenInformation, {
            error: setAdyenInformationMutationError,
            called: setAdyenInformationMutationCalled,
            loading: setAdyenInformationMutationLoading
        }] =useMutation(setAdyenInformationMutation, {
        variables: { cartId }
    });

    const adyenAvailablePaymentMethods =
        (adyenData?.adyenPaymentMethods || null)

    const adyenConfig =
        (adyenData?.storeConfig || null)

    const { data: billingAddressData } = useQuery(getBillingAddressQuery, {
        skip: !cartId,
        variables: { cartId }
    });
    const { data: shippingAddressData } = useQuery(getShippingAddressQuery, {
        skip: !cartId,
        variables: { cartId }
    });
    const { data: isBillingAddressSameData } = useQuery(
        getIsBillingAddressSameQuery,
        { skip: !cartId, variables: { cartId } }
    );
    const [
        updateBillingAddress,
        {
            error: billingAddressMutationError,
            called: billingAddressMutationCalled,
            loading: billingAddressMutationLoading
        }
    ] = useMutation(setBillingAddressMutation);

    const shippingAddressCountry = shippingAddressData
        ? shippingAddressData.cart.shippingAddresses[0].country.code
        : DEFAULT_COUNTRY_CODE;
    const isBillingAddressSame = true;
    const initialValues = useMemo(() => {
        const isBillingAddressSame = isBillingAddressSameData
            ? isBillingAddressSameData.cart.isBillingAddressSame
            : true;

        let billingAddress = {};
        if (billingAddressData && !isBillingAddressSame) {
            if (billingAddressData.cart.billingAddress) {
                const {
                    __typename,
                    ...rawBillingAddress
                } = billingAddressData.cart.billingAddress;
                billingAddress = mapAddressData(rawBillingAddress);
            }
        }

        return { isBillingAddressSame, ...billingAddress };
    }, [isBillingAddressSameData, billingAddressData]);

    const setIsBillingAddressSameInCache = useCallback(() => {
        client.writeQuery({
            query: getIsBillingAddressSameQuery,
            data: {
                cart: {
                    __typename: 'Cart',
                    id: cartId,
                    isBillingAddressSame
                }
            }
        });
    }, [client, cartId, getIsBillingAddressSameQuery, isBillingAddressSame]);

    const setShippingAddressAsBillingAddress = useCallback(() => {
        const shippingAddress = shippingAddressData
            ? mapAddressData(shippingAddressData.cart.shippingAddresses[0])
            : {};

        updateBillingAddress({
            variables: {
                cartId,
                ...shippingAddress,
                sameAsShipping: true
            }
        });
    }, [updateBillingAddress, shippingAddressData, cartId]);

    const setBillingAddress = useCallback(() => {
        const {
            firstName,
            lastName,
            country,
            street1,
            street2,
            city,
            region,
            postcode,
            phoneNumber
        } = formState.values;

        updateBillingAddress({
            variables: {
                cartId,
                firstName,
                lastName,
                country,
                street1,
                street2: street2 || '',
                city,
                region: getRegion(region),
                postcode,
                phoneNumber,
                sameAsShipping: false
            }
        });
    }, [formState.values, updateBillingAddress, cartId]);

    const updateCCDetailsOnCart = useCallback(
        async (ccType, stateData) => {
            try {
                await setAdyenInformation ({
                    variables: {
                        cartId,
                        ccType,
                        stateData
                    },
                });
                client.writeQuery({
                    query: getAdyenPaymentNonceQuery,
                    data: {
                        cart: {
                            __typename: 'Cart',
                            id: cartId,
                            paymentNonce: {
                                type: 'adyen_cc',
                                cardType: ccType,
                                holderName: JSON.parse(stateData).paymentMethod.holderName,
                            },
                        }
                    }
                });
            } catch (error) {
            }
        },
        [setAdyenInformation, cartId]
    );

    const onPaymentSuccess = useCallback(
        (ccType,stateData) => {
            updateCCDetailsOnCart(ccType, stateData);
            setStepNumber(3);
        },
        [ updateCCDetailsOnCart]
    );

    const onPaymentError = useCallback(
        error => {
            setStepNumber(0);
            setShouldRequestPaymentNonce(false);
            resetShouldSubmit();
            if (onError) {
                onError(error);
            }
        },
        [onError, resetShouldSubmit]
    );

    const onPaymentReady = useCallback(() => {
        setAdyenLoading(false);
        setStepNumber(0);
        if (onReady) {
            onReady();
        }
    }, [onReady]);

    const resetShouldTeardownDropin = useCallback(() => {
        setShouldTeardownDropin(false);
    }, []);

    useEffect(() => {
        try {
            if (shouldSubmit) {
                validateBillingAddressForm();

                const hasErrors = Object.keys(formState.errors).length;

                if (!hasErrors) {
                    setStepNumber(1);
                    if (isBillingAddressSame) {
                        setShippingAddressAsBillingAddress();
                    } else {
                        setBillingAddress();
                    }
                    setIsBillingAddressSameInCache();
                } else {
                    throw new Error('Errors in the billing address form');
                }
            }
        } catch (err) {
            if (process.env.NODE_ENV !== 'production') {
                console.error(err);
            }
            setStepNumber(0);
            resetShouldSubmit();
            setShouldRequestPaymentNonce(false);
        }
    }, [
        shouldSubmit,
        isBillingAddressSame,
        setShippingAddressAsBillingAddress,
        setBillingAddress,
        setIsBillingAddressSameInCache,
        resetShouldSubmit,
        validateBillingAddressForm,
        formState.errors
    ]);

    useEffect(() => {
        try {
            const ccMutationCompleted = setAdyenInformationMutationCalled && !setAdyenInformationMutationLoading;

            if (ccMutationCompleted && !setAdyenInformationMutationError) {
                if (onSuccess) {
                    onSuccess();
                }
                resetShouldSubmit();
                setStepNumber(4);
            }

            if (ccMutationCompleted && setAdyenInformationMutationError) {
                throw new Error('Credit card nonce save mutation failed.');
            }
        } catch (err) {
            if (process.env.NODE_ENV !== 'production') {
                console.error(err);
            }
            setStepNumber(0);
            resetShouldSubmit();
            setShouldRequestPaymentNonce(false);
            setShouldTeardownDropin(true);
        }
    }, [
        setAdyenInformationMutationCalled,
        setAdyenInformationMutationLoading,
        onSuccess,
        setShouldRequestPaymentNonce,
        resetShouldSubmit,
        setAdyenInformationMutationError
    ]);

    return {
        onPaymentError,
        onPaymentSuccess,
        onPaymentReady,
        isLoading,
        shouldRequestPaymentNonce,
        stepNumber,
        shouldTeardownDropin,
        resetShouldTeardownDropin,
        recaptchaWidgetProps,
        adyenAvailablePaymentMethods,
        adyenConfig,
        setAdyenPaymentInformation
    };
};
