/* eslint-disable react/prop-types */
import React from 'react';
import { View, ViewProps } from 'react-native';

import Text, {
  TextColor,
  TextVariant,
} from '../../../../component-library/components/Texts/Text';
import { useStyles } from '../../../hooks/useStyles';
import { BalanceChange } from '../types';
import AmountPill from '../AmountPill/AmountPill';
import AssetPill from '../AssetPill/AssetPill';
import { IndividualFiatDisplay } from '../FiatDisplay/FiatDisplay';
import EditRowValue from '../EditRowValue';
import styleSheet from './BalanceChangeRow.styles';

interface BalanceChangeRowProperties extends ViewProps {
  balanceChange: BalanceChange;
  editTexts?: {
    title: string;
    description: string;
  };
  enableEdit?: boolean;
  label?: string;
  onUpdate?: (balanceChange: BalanceChange, val: string) => void;
  showFiat?: boolean;
}

const BalanceChangeRow: React.FC<BalanceChangeRowProperties> = ({
  balanceChange,
  editTexts,
  enableEdit,
  label,
  onUpdate,
  showFiat,
}) => {
  const { styles } = useStyles(styleSheet, {});
  const { asset, amount, fiatAmount, isAllApproval, isUnlimitedApproval } =
    balanceChange;
  return (
    <View style={styles.container}>
      {label && (
        <Text
          testID="balance-change-row-label"
          variant={TextVariant.BodyMDMedium}
          color={TextColor.Alternative}
        >
          {label}
        </Text>
      )}
      <View style={styles.pillContainer}>
        <View style={styles.pills}>
          {enableEdit && onUpdate && editTexts && (
            <EditRowValue
              balanceChange={balanceChange}
              editTexts={editTexts}
              onUpdate={onUpdate}
            />
          )}
          <AmountPill
            asset={asset}
            amount={amount}
            isAllApproval={isAllApproval}
            isUnlimitedApproval={isUnlimitedApproval}
            testID="balance-change-row-amount-pill"
          />
          <AssetPill asset={asset} testID="balance-change-row-asset-pill" />
        </View>
        {showFiat && (
          <IndividualFiatDisplay
            testID="balance-change-row-fiat-display"
            fiatAmount={fiatAmount}
          />
        )}
      </View>
    </View>
  );
};

export default BalanceChangeRow;
