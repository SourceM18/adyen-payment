import { gql } from '@apollo/client';
import {PriceSummaryFragment} from "@magento/peregrine/lib/talons/CartPage/PriceSummary/priceSummaryFragments.gql";
import {AvailablePaymentMethodsFragment} from "@magento/peregrine/lib/talons/CheckoutPage/PaymentInformation/paymentInformation.gql";

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

export const GET_IS_BILLING_ADDRESS_SAME = gql`
    query getIsBillingAddressSame($cartId: String!) {
        cart(cart_id: $cartId) @client {
            id
            isBillingAddressSame
        }
    }
`;
export const GET_BILLING_ADDRESS = gql`
    query getBillingAddress($cartId: String!) {
        cart(cart_id: $cartId) {
            id
            billingAddress: billing_address {
                firstName: firstname
                lastName: lastname
                country {
                    code
                }
                street
                city
                region {
                    code
                    label
                    region_id
                }
                postcode
                phoneNumber: telephone
            }
        }
    }
`;

export const GET_SHIPPING_ADDRESS = gql`
    query getSelectedShippingAddress($cartId: String!) {
        cart(cart_id: $cartId) {
            id
            shippingAddresses: shipping_addresses {
                firstName: firstname
                lastName: lastname
                country {
                    code
                }
                street
                city
                region {
                    code
                    label
                    region_id
                }
                postcode
                phoneNumber: telephone
            }
        }
    }
`;

export const SET_BILLING_ADDRESS = gql`
    mutation setBillingAddress(
        $cartId: String!
        $firstName: String!
        $lastName: String!
        $street1: String!
        $street2: String
        $city: String!
        $region: String!
        $postcode: String!
        $country: String!
        $phoneNumber: String!
    ) {
        setBillingAddressOnCart(
            input: {
                cart_id: $cartId
                billing_address: {
                    address: {
                        firstname: $firstName
                        lastname: $lastName
                        street: [$street1, $street2]
                        city: $city
                        region: $region
                        postcode: $postcode
                        country_code: $country
                        telephone: $phoneNumber
                        save_in_address_book: false
                    }
                }
            }
        ) {
            cart {
                id
                billing_address {
                    firstname
                    lastname
                    country {
                        code
                    }
                    street
                    city
                    region {
                        code
                        label
                        region_id
                    }
                    postcode
                    telephone
                }
                ...PriceSummaryFragment
                ...AvailablePaymentMethodsFragment
            }
        }
    }
    ${PriceSummaryFragment}
    ${AvailablePaymentMethodsFragment}
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
        { cart { id } }
}
`
export const GET_ADYEN_PAYMENT_NONCE = gql`
    query getPaymentNonce($cartId: String!) {
        cart(cart_id: $cartId) @client {
            id
            paymentNonce
        }
    }
`;

export default {
    getPaymentMethodsQuery: GET_PAYMENT_METHODS,
    getAdyenPaymentQuery: GET_ADYEN_PAYMENT,
    getAdyenPaymentNonceQuery: GET_ADYEN_PAYMENT_NONCE,
    setAdyenInformationMutation: SET_ADYEN_INFORMATION,
    getBillingAddressQuery: GET_BILLING_ADDRESS,
    getIsBillingAddressSameQuery: GET_IS_BILLING_ADDRESS_SAME,
    getShippingAddressQuery: GET_SHIPPING_ADDRESS,
    setBillingAddressMutation: SET_BILLING_ADDRESS
};
