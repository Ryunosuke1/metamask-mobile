import Gestures from '../helpers/Gestures';
import Selectors from '../helpers/Selectors';
import { LoginViewSelectors } from '../../e2e/selectors/wallet/LoginView.selectors';

class LoginScreen {
  get loginScreen() {
    return Selectors.getXpathElementByResourceId(LoginViewSelectors.CONTAINER);
  }

  get resetWalletButton() {
    return Selectors.getXpathElementByResourceId(LoginViewSelectors.RESET_WALLET);
  }

  get passwordInput() {
    return Selectors.getXpathElementByResourceId(LoginViewSelectors.PASSWORD_INPUT);
  }

  get unlockButton() {
    // TODO: update the component to have a testID property and use that instead of text
    return Selectors.getXpathElementByText('Unlock');
  }

  get title() {
    return Selectors.getXpathElementByResourceId(LoginViewSelectors.TITLE_ID);
  }

  get rememberMeToggle() {
    return Selectors.getXpathElementByResourceId(LoginViewSelectors.REMEMBER_ME_SWITCH);
  }

  async isLoginScreenVisible() {
    await expect(await this.loginScreen).toBeDisplayed();
  }

  async waitForScreenToDisplay() {
    const element = await this.loginScreen;
    await element.waitForDisplayed({ interval: 100 });
  }

  async tapResetWalletButton() {
    await Gestures.waitAndTap(this.resetWalletButton);
  }

  async typePassword(password) {
    await this.isLoginScreenVisible()
    await Gestures.typeText(this.passwordInput, password);
  }

  async tapUnlockButton() {
    const element = await this.unlockButton;
    await element.click();
  }

  async tapTitle() {
    await Gestures.waitAndTap(this.title);
  }

  async tapRememberMeToggle() {
    await Gestures.waitAndTap(this.rememberMeToggle);
  }
}

export default new LoginScreen();
