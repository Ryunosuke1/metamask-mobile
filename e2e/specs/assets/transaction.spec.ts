import TestHelpers from '../../helpers';
import { Regression } from '../../tags';
import AmountView from '../../pages/Send/AmountView';
import SendView from '../../pages/Send/SendView';
import TransactionConfirmationView from '../../pages/Send/TransactionConfirmView';
import { loginToApp } from '../../viewHelper';
import TabBarComponent from '../../pages/wallet/TabBarComponent';
import enContent from '../../../locales/languages/en.json';
import FixtureBuilder from '../../framework/fixtures/FixtureBuilder';
import NetworkEducationModal from '../../pages/Network/NetworkEducationModal';
import { withFixtures } from '../../framework/fixtures/FixtureHelper';
import Assertions from '../../utils/Assertions';
import WalletView from '../../pages/wallet/WalletView';
import TokenOverview from '../../pages/wallet/TokenOverview';
import { mockEvents } from '../../api-mocking/mock-config/mock-events';
import ToastModal from '../../pages/wallet/ToastModal';

describe(Regression('Transaction'), () => {
  beforeAll(async () => {
    jest.setTimeout(2500000);
    await TestHelpers.reverseServerPort();
  });

  it('send ETH from token detail page and validate the activity', async () => {
    const ETHEREUM_NAME = 'Ethereum';
    const RECIPIENT = '0x1FDb169Ef12954F20A15852980e1F0C122BfC1D6';
    const AMOUNT = '0.12345';
    const TOKEN_NAME = enContent.unit.eth;
    await withFixtures(
      {
        fixture: new FixtureBuilder().withPopularNetworks().build(),
        restartDevice: true,
        testSpecificMock: {
          GET: [mockEvents.GET.remoteFeatureFlagsOldConfirmations],
        },
      },
      async () => {
        await loginToApp();
        await WalletView.tapTokenNetworkFilter();
        await WalletView.tapTokenNetworkFilterAll();

        await WalletView.tapOnToken(ETHEREUM_NAME);
        await TokenOverview.tapSendButton();
        // if (device.getPlatform() === 'ios') {
        //   await NetworkEducationModal.tapNetworkName(ETHEREUM_NAME);
        // }
        await NetworkEducationModal.tapGotItButton();

        await SendView.inputAddress(RECIPIENT);
        await SendView.tapNextButton();

        await AmountView.typeInTransactionAmount(AMOUNT);
        await AmountView.tapNextButton();

        await TransactionConfirmationView.tapConfirmButton();
        await Assertions.checkIfVisible(ToastModal.notificationTitle);
        await Assertions.checkIfNotVisible(ToastModal.notificationTitle);
        await TabBarComponent.tapActivity();
        await Assertions.checkIfTextIsDisplayed(`${AMOUNT} ${TOKEN_NAME}`);
      },
    );
  });
});
