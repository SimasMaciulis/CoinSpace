'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const details = require('lib/wallet/details');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      message: '',
    },
    partials: {
      footer: require('../footer.ract'),
    },
  });

  ractive.on('before-show', (context) => {
    ractive.set('message', context.message);
  });

  ractive.on('close', () => {
    details.set('shapeshiftInfo', null).then(() => {
      emitter.emit('change-shapeshift-step', 'create');
    }).catch((err) => {
      console.error(err);
    });
  });

  return ractive;
};
