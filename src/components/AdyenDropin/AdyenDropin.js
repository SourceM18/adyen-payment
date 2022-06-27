import React, { useEffect, useRef } from 'react';
import AdyenCheckout from "@adyen/adyen-web";
import "@adyen/adyen-web/dist/adyen.css";
import {usePaymentMethods} from "@magento/peregrine/lib/talons/CheckoutPage/PaymentInformation/usePaymentMethods";
import {useAdyen} from "./talons/useAdyen";

let checkout = null

export default function AdyenDropin (props) {
    const talonProps = usePaymentMethods(({}))
    const {onPaymentSuccess, onPaymentError, resetShouldSubmit, shouldSubmit} = props
    const talon = useAdyen({
        onError: onPaymentError,
        onSuccess: onPaymentSuccess,
        resetShouldSubmit: resetShouldSubmit,
        shouldSubmit: shouldSubmit,
    });

    const { adyenConfig, adyenAvailablePaymentMethods } = talonProps

    async function initAdyenCheckout() {
             const configuration = {
            locale: "en_US",
            environment:  adyenConfig.adyen_demo_mode ? "test" : "live",
            clientKey: adyenConfig.adyen_demo_mode ? adyenConfig.adyen_client_key_test :  adyenConfig.adyen_client_key_live,
            paymentMethodsResponse: adyenAvailablePaymentMethods.paymentMethodsResponse,
            analytics: {
                enabled: false
            },
            showPayButton: false,
            onSubmit: () => {
            },

            paymentMethodsConfiguration: {
                card: {
                    hasHolderName: true,
                    holderNameRequired: true,
                    enableStoreDetails: true,
                    hideCVC: true,
                }
            }
        };

         checkout = await AdyenCheckout(configuration);

        checkout
            .create("dropin", {
                onSubmit: (state, dropin) => {
                    onPaymentSuccess(state.data.paymentMethod.brand, JSON.stringify(state.data))
                    dropin.setStatus("loading");
                },
            })
            .mount(dropinAdyenRef.current);
    }

    const dropinAdyenRef = useRef(null);

    useEffect(() => {
        initAdyenCheckout();
    }, []);

    if(shouldSubmit) {
        checkout.components[0].submit()
    }


    return (
        <>
            <div ref={dropinAdyenRef} />
        </>

    )};


