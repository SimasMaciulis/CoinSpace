'use strict';

const Ractive = require('lib/ractive');
const LS = require('lib/wallet/localStorage');
const Avatar = require('lib/avatar');
const CS = require('lib/wallet');
const details = require('lib/wallet/details');
const importPrivateKey = require('widgets/modals/import-private-key');
const exportPrivateKeys = require('widgets/modals/export-private-keys');
const showEosSetupAccount = require('widgets/modals/eos-setup-account');
const { translate } = require('lib/i18n');
const os = require('lib/detect-os');
const touchId = require('lib/touch-id');
const emitter = require('lib/emitter');

module.exports = function(el) {
  const currency = details.get('systemInfo').preferredCurrency;
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      avatar: '',
      username: '',
      isEnabledImport: true,
      isEnabledExport: true,
      isEOS: false,
      securityPinLabel: getSecurityPinLabel(),
      walletName: '',
      currencies: [
        'AUD', 'BRL', 'CAD', 'CHF', 'CNY',
        'DKK', 'EUR', 'GBP', 'IDR', 'ILS',
        'JPY', 'MXN', 'NOK', 'NZD', 'PLN',
        'RUB', 'SEK', 'SGD', 'TRY', 'UAH',
        'USD', 'ZAR',
      ],
      currency,
    },
  });

  ractive.on('before-show', () => {
    const wallet = CS.getWallet();
    ractive.set('isEOS', wallet.networkName === 'eos');
    ractive.set('walletName', wallet.name);
    if (wallet.networkName === 'ethereum' && wallet.token) {
      ractive.set('isEnabledImport', false);
      ractive.set('isEnabledExport', false);
    } else if (wallet.networkName === 'eos') {
      ractive.set('isEnabledImport', false);
      ractive.set('isEnabledExport', true);
    } else {
      ractive.set('isEnabledImport', true);
      ractive.set('isEnabledExport', true);
    }
  });

  ractive.on('account', () => {
    ractive.fire('change-step', { step: 'account' });
  });

  ractive.on('security-pin', () => {
    ractive.fire('change-step', { step: 'securityPin' });
  });
  ractive.on('security-hardware', () => {
    ractive.fire('change-step', { step: 'securityHardware' });
  });

  ractive.on('before-show', ({ userInfo }) => {
    if (userInfo) {
      const avatar = Avatar.getAvatar(userInfo.email, userInfo.avatarIndex, 64);
      ractive.set('avatar', `url('${avatar}')`);
      ractive.set('username', userInfo.username || translate('Your username'));
    }
  });

  ractive.on('import-private-key', importPrivateKey);
  ractive.on('export-private-keys', exportPrivateKeys);
  ractive.on('eos-setup-account', showEosSetupAccount);

  ractive.on('support', () => {
    if (process.env.BUILD_TYPE === 'phonegap') {
      window.Zendesk.showHelpCenter();
    } else {
      window.safeOpen('https://coinapp.zendesk.com/hc/en-us/sections/115000511287-FAQ', '_blank');
    }
  });

  ractive.on('about', () => {
    ractive.fire('change-step', { step: 'about' });
  });

  ractive.on('logout', () => {
    LS.reset();
    location.reload();
  });

  ractive.on('setPreferredCurrency', () => {
    const currency = ractive.get('currency');
    details.set('systemInfo', {
      preferredCurrency: currency,
    }).then(() => {
      emitter.emit('currency-changed', currency);
    }, (err) => {
      console.error(err);
    });
  });

  return ractive;
};

function getSecurityPinLabel() {
  if (!touchId.isAvailable()) return translate('PIN');
  if (os === 'ios' || os === 'macos') {
    return translate('PIN & Touch ID');
  } else if (os === 'android') {
    return translate('PIN & Fingerprint');
  } else {
    return translate('PIN & Biometrics');
  }
}
