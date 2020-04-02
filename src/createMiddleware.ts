import { Middleware, MiddlewareAPI } from 'redux';
import Twilio from 'twilio-client';

import {
  setup,
  onReady,
  onConnect,
  onError,
  onDisconnect,
  onIncoming,
  onOffline,
  onCancel,
  destroy,
  setInputDevice,
  setOutputDevice,
  testOutputDevice,
  error,
  Action,
} from './actions';
import * as actionTypes from './actionTypes';
import {
  getSerializableFromConnection,
  getSerializableFromDevice,
} from './utils';

export const CONSTANTS = {
  TCR_INPUT_DEVICE_KEY: 'tcr_input_device',
  TCR_OUTPUT_DEVICE_KEY: 'tcr_output_device',
};

/**
 * Default middleware opts
 * @private
 */
const defaultOptions = {
  storeAudioDevices: true,
  connectOnIncoming: true,
  prefix: actionTypes.DEFAULT_PREFIX,
};

/**
 * Create the middleware.
 *
 * @param {Options} opts
 *
 * @returns {Middleware}
 */
export interface MiddlewareOptions {
  storeAudioDevices?: boolean;
  connectOnIncoming?: boolean;
  prefix?: string;
}
export default (opts?: MiddlewareOptions): Middleware => {
  const options = { ...defaultOptions, ...opts };
  const { prefix } = options;
  const actionPrefixExp = RegExp(`^${prefix}::`);

  // Support multiple devices
  let devices: {
    [key: string]: typeof Twilio.Device;
  } = {};

  const getAudioConstraints = () => {
    let audioConstraints = {};
    if (localStorage.getItem(CONSTANTS.TCR_INPUT_DEVICE_KEY)) {
      audioConstraints = {
        optional: [
          { sourceId: localStorage.getItem(CONSTANTS.TCR_INPUT_DEVICE_KEY) },
        ],
      };
    }
    return audioConstraints;
  };

  // Define the list of handlers, now that we have an instance of ReduxWebSocket.
  const handlers = {
    [setup.type]: (
      { dispatch }: MiddlewareAPI,
      { payload: { token, opts, deviceId } }: ReturnType<typeof setup>
    ) => {
      // Create a device
      if (!devices[deviceId]) {
        devices[deviceId] = new Twilio.Device();
      }

      devices[deviceId].setup(token, opts);

      // Register the listeners and dispatch their actions
      devices[deviceId].on('cancel', (connection: any) =>
        dispatch(onCancel(getSerializableFromConnection(connection)))
      );
      devices[deviceId].on('connect', (connection: any) => {
        dispatch(onConnect(getSerializableFromConnection(connection)));
      });
      devices[deviceId].on('error', (error: any) => dispatch(onError(error)));
      devices[deviceId].on('disconnect', (connection: any) =>
        dispatch(onDisconnect(getSerializableFromConnection(connection)))
      );
      devices[deviceId].on('incoming', (connection: any) => {
        if (options.connectOnIncoming) {
          connection.accept(getAudioConstraints());
        }
        dispatch(onIncoming(getSerializableFromConnection(connection)));
      });
      devices[deviceId].on('offline', (device: any) =>
        dispatch(onOffline(getSerializableFromDevice(device)))
      );
      devices[deviceId].on('ready', (device: any) => {
        // TODO: handle missing device
        if (localStorage.getItem(CONSTANTS.TCR_OUTPUT_DEVICE_KEY)) {
          device.audio.speakerDevices.set(
            localStorage.getItem(CONSTANTS.TCR_OUTPUT_DEVICE_KEY)
          );
          device.audio.speakerDevices.test();
        }
        dispatch(onReady(getSerializableFromDevice(device)));
      });
    },
    [destroy.type]: (
      { dispatch }: MiddlewareAPI,
      { payload: { deviceId } }: ReturnType<typeof destroy>
    ) => {
      if (deviceId && devices[deviceId]) {
        devices[deviceId].device.destroy();
      } else {
        console.error(`Device ${deviceId} not found or already destroyed`);
      }
    },
    [setInputDevice.type]: (
      _: MiddlewareAPI,
      { payload }: ReturnType<typeof setInputDevice>
    ) => {
      let storageType = sessionStorage;
      if (options.storeAudioDevices) {
        storageType = localStorage;
      }
      storageType.setItem(
        CONSTANTS.TCR_INPUT_DEVICE_KEY,
        payload.audioDeviceId
      );
    },
    [setOutputDevice.type]: (
      _: MiddlewareAPI,
      { payload }: ReturnType<typeof setOutputDevice>
    ) => {
      let storageType = sessionStorage;
      if (options.storeAudioDevices) {
        storageType = localStorage;
      }
      storageType.setItem(
        CONSTANTS.TCR_OUTPUT_DEVICE_KEY,
        payload.audioDeviceId
      );
    },
    [testOutputDevice.type]: (
      _: MiddlewareAPI,
      { payload }: ReturnType<typeof testOutputDevice>
    ) => {
      devices[payload.deviceId].audio.speakerDevices.test();
    },
  };

  // Middleware function.
  return (store: MiddlewareAPI) => next => (action: Action) => {
    const { dispatch } = store;
    const { type: actionType } = action;

    // Check if action type matches prefix
    if (actionType && actionType.match(actionPrefixExp)) {
      const baseActionType = action.type.replace(actionPrefixExp, '');
      const handler = Reflect.get(handlers, baseActionType);

      if (handler) {
        try {
          handler(store, action);
        } catch (err) {
          dispatch(error(action, err));
        }
      }
    }

    return next(action);
  };
};
