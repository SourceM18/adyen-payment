import { useCallback, useEffect, useState } from 'react';
import { useApolloClient, useMutation } from '@apollo/client';
import mergeOperations from '@magento/peregrine/lib/util/shallowMerge';

import { useCartContext } from '@magento/peregrine/lib/context/cart';

import DEFAULT_OPERATIONS from '@magento/peregrine/lib/talons/CheckoutPage/PaymentInformation/paymentMethods.gql';
import { useGoogleReCaptcha } from '@magento/peregrine/lib/hooks/useGoogleReCaptcha';

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

/**
 * Talon to handle Credit Card payment method.
 *
 * @param {Boolean} props.shouldSubmit boolean value which represents if a payment nonce request has been submitted
 * @param {Function} props.onSuccess callback to invoke when the a payment nonce has been generated
 * @param {Function} props.onReady callback to invoke when the braintree dropin component is ready
 * @param {Function} props.onError callback to invoke when the braintree dropin component throws an error
 * @param {Function} props.resetShouldSubmit callback to reset the shouldSubmit flag
 *
 * @returns {
 *   errors: Map<String, Error>,
 *   shouldRequestPaymentNonce: Boolean,
 *   onPaymentError: Function,
 *   onPaymentSuccess: Function,
 *   onPaymentReady: Function,
 *   isLoading: Boolean,
 *   stepNumber: Number,
 *   initialValues: {
 *      firstName: String,
 *      lastName: String,
 *      city: String,
 *      postcode: String,
 *      phoneNumber: String,
 *      street1: String,
 *      street2: String,
 *      country: String,
 *      state: String,
 *      isBillingAddressSame: Boolean
 *   },
 *   shippingAddressCountry: String,
 *   shouldTeardownDropin: Boolean,
 *   resetShouldTeardownDropin: Function
 * }
 */
export const useAdyen = props => {
    const {
        onSuccess,
        onReady,
        onError,
        resetShouldSubmit
    } = props;

    const operations = mergeOperations(DEFAULT_OPERATIONS, props.operations);

    const {
        setAdyenInformationMutation,
    } = operations;

    const {
        recaptchaLoading,
        recaptchaWidgetProps
    } = useGoogleReCaptcha({
        currentForm: 'BRAINTREE',
        formAction: 'braintree'
    });

    const [isAdyenLoading, setAdyenLoading] = useState(true);
    const [shouldRequestPaymentNonce, setShouldRequestPaymentNonce] = useState(
        false
    );
    const [shouldTeardownDropin, setShouldTeardownDropin] = useState(false);


    const [stepNumber, setStepNumber] = useState(0);

    const client = useApolloClient();
    const [{ cartId }] = useCartContext();

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
            } catch (error) {
            }
        },
        [setAdyenInformation, cartId]
    );

    const onPaymentSuccess = useCallback(
        () => {
            updateCCDetailsOnCart();
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
    };
};
