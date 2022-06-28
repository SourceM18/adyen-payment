import React, {useEffect, useState} from 'react';
import { func, shape, string } from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Edit2 as EditIcon } from 'react-feather';

import { useStyle } from '@magento/venia-ui/lib/classify';
import Icon from '@magento/venia-ui/lib/components/Icon';
import LinkButton from '@magento/venia-ui/lib/components/LinkButton';

import defaultClasses from './summary.module.css';
import { useAdyenSummary } from "./talons/useAdyenSummary";

const Summary = props => {
    const [cardType, setCardType] =useState(null)
    const { onEdit } = props;

    const classes = useStyle(defaultClasses, props.classes)

    const { selectedPaymentMethod } = useAdyenSummary();

    useEffect(()=>{

        switch (selectedPaymentMethod.cardType) {
            case "mc" :
               setCardType('MasterCard')
                break
            case 'visa':
                setCardType('Visa')
                break
            case 'amex':
                setCardType('American Express')
                break
            default:
                setCardType('Unknown')
                break
        }

    }, [selectedPaymentMethod])


    return (
        <div className={classes.root}>
            <div className={classes.heading_container}>
                <h5 className={classes.heading}>
                    <FormattedMessage
                        id={'checkoutPage.paymentInformation'}
                        defaultMessage={'Payment Information'}
                    />
                </h5>
                <LinkButton
                    className={classes.edit_button}
                    onClick={onEdit}
                    type="button"
                >
                    <Icon
                        size={16}
                        src={EditIcon}
                        classes={{ icon: classes.edit_icon }}
                    />
                    <span className={classes.edit_text}>
                        <FormattedMessage
                            id={'global.editButton'}
                            defaultMessage={'Edit'}
                        />
                    </span>
                </LinkButton>
            </div>
            <div className={classes.adyen_details_container}>
                <span className={classes.payment_type}>
                    <FormattedMessage
                        id={'adyen_cc.paymentType'}
                        defaultMessage={'Credit Card 2'}
                    />
                    <br />
                    <FormattedMessage
                        id={'adyen_cc.cardType'}
                        defaultMessage={cardType}
                    />
                </span>
            </div>
            <div className={classes.adyen_details_container}>
                <span className={classes.payment_type}>
                    <FormattedMessage
                        id={'adyen_cc.holderName'}
                        defaultMessage={selectedPaymentMethod.holderName}
                    />
                </span>
            </div>
        </div>
    );
};

export default Summary;

Summary.propTypes = {
    classes: shape({
        root: string,
        adyen_details_container: string,
        edit_button: string,
        edit_icon: string,
        edit_text: string,
        heading_container: string,
        heading: string,
        payment_type: string
    }),
    onEdit: func
};
