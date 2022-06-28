

import { useQuery } from '@apollo/client';

import { useCartContext } from '@magento/peregrine/lib/context/cart';
import mergeOperations from '@magento/peregrine/lib/util/shallowMerge';

import defaultOperations from 'src/overrides/peregrine/talons/CheckoutPage/PaymentInformation/paymentMethods.gql';
/**
 * Talon to handle summary component in payment information section of
 * the checkout page.
 *
 * @param {DocumentNode} props.queries.getSummaryData gets data from the server for rendering this component
 *
 * @returns {
 *   isLoading: Boolean,
 *   selectedPaymentMethod: {
 *      code: String,
 *      title: String
 *   }
 * }
 */
export const useAdyenSummary = (props = {}) => {
    const operations = mergeOperations(defaultOperations, props.operations);

    const { getAdyenPaymentNonceQuery } = operations;

    const [{ cartId }] = useCartContext();

    const { data: summaryData, loading: summaryDataLoading } = useQuery(
        getAdyenPaymentNonceQuery,
        {
            skip: !cartId,
            variables: { cartId }
        }
    );

    const selectedPaymentMethod = summaryData
        ? summaryData.cart.paymentNonce
        : null
    return {
        isLoading: summaryDataLoading,
        selectedPaymentMethod
    };
};
