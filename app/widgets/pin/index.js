'use strict';

const Ractive = require('lib/ractive');
const { translate } = require('lib/i18n');
const LS = require('lib/wallet/localStorage');
const showLegacyTouchId = require('lib/legacy-touch-id');

function open(options) {
  const {
    header = translate('Enter your PIN'),
    headerLoading = translate('Verifying PIN'),
    backLabel = translate('Back'),
    onPin = () => {},
    onTouchId = () => {},
    touchId,
    append = false,
  } = options;
  // eslint-disable-next-line max-len
  const legacyTouchIdIsAvailable = LS.getPin() && !!LS.getCredentials() && window.legacyTouchIdIsAvailable;
  const fidoTouchIdIsAvailable = LS.isTouchIdEnabled();

  const ractive = new Ractive({
    el: document.getElementById('general-purpose-overlay'),
    append,
    template: require('./index.ract'),
    data: {
      header,
      backLabel,
      isLoading: false,
      isWrong: false,
      isOpen: false,
      description: '',
      pin: '',
      touchId: touchId && (legacyTouchIdIsAvailable || fidoTouchIdIsAvailable),
      enter,
    },
    oncomplete() {
      ractive.find('.widget-pin').focus();
      setTimeout(() => this.set('isOpen', true), 1); // ios fix
    },
    onteardown() {
      this.set('isOpen', false);
    },
  });

  ractive.on('keyboard', (context) => {
    const which = context.original.which || context.original.keyCode;
    const number = which - 48;
    enter(number);
  });

  ractive.observe('pin', (pin) => {
    pin = pin.trim();
    if (pin.length === 4) {
      ractive.set('isLoading', true);
      ractive.set('header', headerLoading);
      onPin(pin);
    }
  });

  ractive.on('backspace', () => {
    if (ractive.get('isLoading')) return;
    const pin = ractive.get('pin').trim();
    if (pin.length === 0 || pin.length === 4) return;
    ractive.set('pin', pin.substr(0, pin.length - 1));
  });

  ractive.on('touch-id', async () => {
    if (ractive.get('isLoading')) return;

    if (fidoTouchIdIsAvailable) {
      return onTouchId();
    }

    if (legacyTouchIdIsAvailable) {
      try {
        await showLegacyTouchId();
        ractive.set('pin', LS.getPin());
      } catch (err) {
        // nothing
      }
    }
  });

  ractive.on('back', () => {
    if (ractive.get('isLoading')) return;
    ractive.close();
  });

  ractive.wrong = (error) => {
    ractive.set('isLoading', false);
    ractive.set('isWrong', true);
    ractive.set('header', header);
    ractive.set('description', error && translate(error));
    ractive.set('pin', '');
    setTimeout(() => {
      ractive.set('isWrong', false);
    }, 700);
  };

  ractive.loadingWallet = () => {
    ractive.set('isLoading', true);
    ractive.set('header', translate('Synchronizing Wallet'));
    ractive.set('description', translate('This might take some time,') + '<br/>' + translate('please be patient.'));
  };

  ractive.close = () => {
    ractive.set('isOpen', false);
    setTimeout(() => {
      ractive.teardown();
    }, 300);
  };

  function enter(number) {
    const pin = ractive.get('pin');
    if (pin.length === 4) return;
    ractive.set('pin', pin + number);
  }

  return ractive;
}

module.exports = open;
