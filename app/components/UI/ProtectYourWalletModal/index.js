import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import ActionModal from '../ActionModal';
import { fontStyles } from '../../../styles/common';
import { connect } from 'react-redux';
import { protectWalletModalNotVisible } from '../../../actions/user';
import Icon from 'react-native-vector-icons/FontAwesome';
import { strings } from '../../../../locales/i18n';
import scaling from '../../../util/scaling';
import { MetaMetricsEvents } from '../../../core/Analytics';

import { ThemeContext, mockTheme } from '../../../util/theme';
import { ProtectWalletModalSelectorsIDs } from '../../../../e2e/selectors/Onboarding/ProtectWalletModal.selectors';
import { withMetricsAwareness } from '../../../components/hooks/useMetrics';
import { selectSeedlessOnboardingLoginFlow } from '../../../selectors/seedlessOnboardingController';

const protectWalletImage = require('../../../images/explain-backup-seedphrase.png'); // eslint-disable-line

const createStyles = (colors) =>
  StyleSheet.create({
    wrapper: {
      marginTop: 24,
      marginHorizontal: 24,
      flex: 1,
    },
    title: {
      ...fontStyles.bold,
      color: colors.text.default,
      textAlign: 'center',
      fontSize: 20,
      flex: 1,
    },
    imageWrapper: {
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: 12,
      marginTop: 30,
    },
    image: {
      width: scaling.scale(135, { baseModel: 1 }),
      height: scaling.scale(160, { baseModel: 1 }),
    },
    text: {
      ...fontStyles.normal,
      color: colors.text.default,
      textAlign: 'center',
      fontSize: 14,
      marginBottom: 24,
    },
    closeIcon: {
      padding: 5,
    },
    learnMoreText: {
      textAlign: 'center',
      ...fontStyles.normal,
      color: colors.primary.default,
      marginBottom: 14,
      fontSize: 14,
    },
    modalXIcon: {
      fontSize: 16,
      color: colors.text.default,
    },
    titleWrapper: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    auxCenter: {
      width: 26,
    },
  });

/**
 * View that renders an action modal
 */
class ProtectYourWalletModal extends PureComponent {
  static propTypes = {
    navigation: PropTypes.object,
    /**
     * Hide this modal
     */
    protectWalletModalNotVisible: PropTypes.func,
    /**
     * Whether this modal is visible
     */
    protectWalletModalVisible: PropTypes.bool,
    /**
     * Boolean that determines if the user has set a password before
     */
    passwordSet: PropTypes.bool,
    /**
     * Metrics injected by withMetricsAwareness HOC
     */
    metrics: PropTypes.object,
    /**
     * A boolean representing if the user is in the seedless onboarding login flow
     */
    isSeedlessOnboardingLoginFlow: PropTypes.bool,
  };

  goToBackupFlow = () => {
    this.props.protectWalletModalNotVisible();
    this.props.navigation.navigate(
      'SetPasswordFlow',
      this.props.passwordSet ? { screen: 'AccountBackupStep1' } : undefined,
    );
    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.WALLET_SECURITY_PROTECT_ENGAGED)
        .addProperties({
          wallet_protection_required: false,
          source: 'Modal',
        })
        .build(),
    );
  };

  onLearnMore = () => {
    this.props.protectWalletModalNotVisible();
    this.props.navigation.navigate('Webview', {
      screen: 'SimpleWebview',
      params: {
        url: 'https://support.metamask.io/privacy-and-security/basic-safety-and-security-tips-for-metamask/',
        title: strings('protect_wallet_modal.title'),
      },
    });
  };

  onDismiss = () => {
    this.props.protectWalletModalNotVisible();
    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.WALLET_SECURITY_PROTECT_DISMISSED)
        .addProperties({
          wallet_protection_required: false,
          source: 'Modal',
        })
        .build(),
    );
  };

  render() {
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    // will not render if the user is in the seedless onboarding login flow
    if (this.props.isSeedlessOnboardingLoginFlow) {
      return null;
    }

    return (
      <ActionModal
        modalVisible={this.props.protectWalletModalVisible}
        cancelText={strings('protect_wallet_modal.top_button')}
        confirmText={strings('protect_wallet_modal.bottom_button')}
        onCancelPress={this.goToBackupFlow}
        onRequestClose={this.onDismiss}
        onConfirmPress={this.onDismiss}
        cancelButtonMode={'sign'}
        confirmButtonMode={'transparent-blue'}
        verticalButtons
        cancelTestID={ProtectWalletModalSelectorsIDs.CANCEL_BUTTON}
        confirmTestID={ProtectWalletModalSelectorsIDs.CONFIRM_BUTTON}
      >
        <View
          style={styles.wrapper}
          testID={ProtectWalletModalSelectorsIDs.CONTAINER}
        >
          <View style={styles.titleWrapper}>
            <View style={styles.auxCenter} />
            <Text style={styles.title}>
              {strings('protect_wallet_modal.title')}
            </Text>
            <TouchableOpacity
              onPress={this.onDismiss}
              style={styles.closeIcon}
              hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}
            >
              <Icon name="times" style={styles.modalXIcon} />
            </TouchableOpacity>
          </View>
          <View style={styles.imageWrapper}>
            <Image source={protectWalletImage} style={styles.image} />
          </View>

          <Text style={styles.text}>
            {strings('protect_wallet_modal.text')}
            <Text style={{ ...fontStyles.bold }}>
              {' ' + strings('protect_wallet_modal.text_bold')}
            </Text>
          </Text>

          <TouchableOpacity
            onPress={this.onLearnMore}
            testID={ProtectWalletModalSelectorsIDs.LEARN_MORE_BUTTON}
          >
            <Text style={styles.learnMoreText}>
              {strings('protect_wallet_modal.action')}
            </Text>
          </TouchableOpacity>
        </View>
      </ActionModal>
    );
  }
}

const mapStateToProps = (state) => ({
  protectWalletModalVisible: state.user.protectWalletModalVisible,
  passwordSet: state.user.passwordSet,
  isSeedlessOnboardingLoginFlow: selectSeedlessOnboardingLoginFlow(state),
});

const mapDispatchToProps = (dispatch) => ({
  protectWalletModalNotVisible: (enable) =>
    dispatch(protectWalletModalNotVisible()),
});

ProtectYourWalletModal.contextType = ThemeContext;

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withMetricsAwareness(ProtectYourWalletModal));
