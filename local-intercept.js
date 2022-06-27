/* eslint-disable */
/**
 * Custom interceptors for the project.
 *
 * This project has a section in its package.json:
 *    "pwa-studio": {
 *        "targets": {
 *            "intercept": "./local-intercept.js"
 *        }
 *    }
 *
 * This instructs Buildpack to invoke this file during the intercept phase,
 * as the very last intercept to run.
 *
 * A project can intercept targets from any of its dependencies. In a project
 * with many customizations, this function would tap those targets and add
 * or modify functionality from its dependencies.
 */

function localIntercept(targets) {
    targets.of('@magento/venia-ui').checkoutPagePaymentTypes.tap(
        checkoutPagePaymentTypes => checkoutPagePaymentTypes.add({
            paymentCode: 'adyen_cc',
            importPath: 'src/components/AdyenDropin/AdyenDropin'
        })
    );
}

module.exports = localIntercept;
