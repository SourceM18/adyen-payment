import { gql } from '@apollo/client';

export const GET_PAYMENT_METHODS = gql`
    query getPaymentMethods($cartId: String!) {
        cart(cart_id: $cartId) {
            id
            available_payment_methods {
                code
                title
            }
        }
    }
`;

export const GET_ADYEN_PAYMENT = gql`
query getAdyenPaymentMethods($cartId: String!) {
    storeConfig {
    store_code
    adyen_client_key_live
    adyen_client_key_test
    adyen_demo_mode
    adyen_has_holder_name
    adyen_holder_name_required
    adyen_return_path_error
    adyen_oneclick_card_mode
    adyen_title_renderer
    }
    adyenPaymentMethods(cart_id: $cartId) {
        paymentMethodsExtraDetails {
            type
            icon {
                url
                width
                height
            }
            isOpenInvoice
            configuration {
                amount {
                    value
                    currency
                }
                currency
            }
        }
        paymentMethodsResponse {
            paymentMethods {
                name
                type
                brand
                brands
                configuration {
                    merchantId
                    merchantName
                }
                details {
                    key
                    type
                    items {
                        id
                        name
                    }
                    optional
                }
            }
        }
    }
}
`
export const SET_ADYEN_INFORMATION = gql`
    mutation setPaymentMethodOnCard ($cartId: String!, $ccType: String!, $stateData: String!) {
        setPaymentMethodOnCart (
            input: {
                cart_id: $cartId
                payment_method: {
                    code: "adyen_cc"
                    adyen_additional_data_cc: {
                        cc_type: $ccType
                        stateData: $stateData
                    }
                }
            }
        )
        { cart_id }
}
`
export default {
    getPaymentMethodsQuery: GET_PAYMENT_METHODS,
    getAdyenPaymentQuery: GET_ADYEN_PAYMENT,
    setAdyenInformationMutation: SET_ADYEN_INFORMATION
};
