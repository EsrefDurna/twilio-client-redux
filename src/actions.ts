import {
  DEFAULT_PREFIX,
  DEVICE_SETUP,
  DEVICE_DESTROY,
  DEVICE_EVENT_CANCEL,
  DEVICE_EVENT_CONNECT,
  DEVICE_EVENT_ERROR,
  DEVICE_EVENT_DISCONNECT,
  DEVICE_EVENT_INCOMING,
  DEVICE_EVENT_OFFLINE,
  DEVICE_EVENT_READY,
  DEVICE_SET_INPUT_DEVICE,
  DEVICE_SET_OUTPUT_DEVICE,
  DEVICE_TEST_OUTPUT_DEVICE,
  UNHANDLED_ERROR,
} from './actionTypes';
import { Action } from 'types';
import { miniSerializeError } from './utils';

type PayloadAction<T> = {
  type: string;
  meta: {
    timestamp: string;
  };
  payload: T;
};

/**
 * Action creator util
 *
 * @param {string} actionType
 * @param {T} payload
 *
 * @returns {PayloadAction<T>}
 */
function createAction<T>(
  type: string,
  payload: T,
  meta?: any
): PayloadAction<T> {
  const action = {
    type,
    meta: {
      timestamp: String(new Date()),
      ...meta,
    },
    payload,
  };

  return action;
}
// Action creators for user dispatched actions. These actions are all optionally
// prefixed.
export const setup = (
  token: string,
  opts?: DeviceConfigOptions,
  deviceId: string = 'default'
) => {
  return createAction(`${DEFAULT_PREFIX}::${DEVICE_SETUP}`, {
    token,
    opts,
    deviceId,
  });
};
export const destroy = (deviceId: string = 'default') =>
  createAction(`${DEFAULT_PREFIX}::${DEVICE_DESTROY}`, { deviceId });

export const setInputDevice = (
  audioDeviceId: string,
  deviceId: string = 'default'
) =>
  createAction(`${DEFAULT_PREFIX}::${DEVICE_SET_INPUT_DEVICE}`, {
    audioDeviceId,
    deviceId,
  });
export const setOutputDevice = (
  audioDeviceId: string,
  deviceId: string = 'default'
) =>
  createAction(`${DEFAULT_PREFIX}::${DEVICE_SET_OUTPUT_DEVICE}`, {
    audioDeviceId,
    deviceId,
  });
export const testOutputDevice = (
  audioDeviceId?: string,
  deviceId: string = 'default'
) =>
  createAction(`${DEFAULT_PREFIX}::${DEVICE_TEST_OUTPUT_DEVICE}`, {
    audioDeviceId,
    deviceId,
  });

// Action creators for actions dispatched by twilio-client-redux - tied to Device Events

export const onCancel = (connection: object) =>
  createAction(`${DEFAULT_PREFIX}::${DEVICE_EVENT_CANCEL}`, connection);
export const onConnect = (connection: object) =>
  createAction(`${DEFAULT_PREFIX}::${DEVICE_EVENT_CONNECT}`, connection);
export const onError = (error: object) =>
  createAction(`${DEFAULT_PREFIX}::${DEVICE_EVENT_ERROR}`, error);
export const onDisconnect = (connection: object) =>
  createAction(`${DEFAULT_PREFIX}::${DEVICE_EVENT_DISCONNECT}`, connection);
export const onIncoming = (connection: object) =>
  createAction(`${DEFAULT_PREFIX}::${DEVICE_EVENT_INCOMING}`, connection);
export const onOffline = (device: object) =>
  createAction(`${DEFAULT_PREFIX}::${DEVICE_EVENT_OFFLINE}`, device);
export const onReady = (device: object) =>
  createAction(`${DEFAULT_PREFIX}::${DEVICE_EVENT_READY}`, device);

export const error = (action: Action | null, err: Error) =>
  createAction(`${DEFAULT_PREFIX}::${UNHANDLED_ERROR}`, err, {
    error: miniSerializeError(err),
    payload: action,
  });

// Twilio Device Options
export enum SoundName {
  Incoming = 'incoming',
  Outgoing = 'outgoing',
  Disconnect = 'disconnect',
  Dtmf0 = 'dtmf0',
  Dtmf1 = 'dtmf1',
  Dtmf2 = 'dtmf2',
  Dtmf3 = 'dtmf3',
  Dtmf4 = 'dtmf4',
  Dtmf5 = 'dtmf5',
  Dtmf6 = 'dtmf6',
  Dtmf7 = 'dtmf7',
  Dtmf8 = 'dtmf8',
  Dtmf9 = 'dtmf9',
  DtmfS = 'dtmfs',
  DtmfH = 'dtmfh',
}
export enum Codec {
  Opus = 'opus',
  PCMU = 'pcmu',
}
export interface DeviceConfigOptions {
  [key: string]: any;
  /**
   * Whether the Device should raise the {@link incomingEvent} event when a new call invite is
   * received while already on an active call. Default behavior is false.
   */
  allowIncomingWhileBusy?: boolean;

  /**
   * Audio Constraints to pass to getUserMedia when making or accepting a Call.
   * This is placed directly under `audio` of the MediaStreamConstraints object.
   */
  audioConstraints?: MediaTrackConstraints | boolean;

  /**
   * Whether to enable close protection, to prevent users from accidentally
   * navigating away from the page during a call. If string, the value will
   * be used as a custom message.
   */
  closeProtection?: boolean | string;
  /**
   * An ordered array of codec names, from most to least preferred.
   */
  codecPreferences?: Codec[];
  /**
   * Whether to enable debug logging.
   */
  debug?: boolean;
  /**
   * Whether AudioContext sounds should be disabled. Useful for trouble shooting sound issues
   * that may be caused by AudioContext-specific sounds. If set to true, will fall back to
   * HTMLAudioElement sounds.
   */
  disableAudioContextSounds?: boolean;

  /**
   * Whether to use googDscp in RTC constraints.
   */
  dscp?: boolean;

  /**
   * Whether to automatically restart ICE when media connection fails
   */
  enableIceRestart?: boolean;

  /**
   * Whether the ringing state should be enabled on {@link Connection} objects. This is required
   * to enable answerOnBridge functionality.
   */
  enableRingingState?: boolean;

  /**
   * Whether or not to override the local DTMF sounds with fake dialtones. This won't affect
   * the DTMF tone sent over the connection, but will prevent double-send issues caused by
   * using real DTMF tones for user interface. In 2.0, this will be enabled by default.
   */
  fakeLocalDTMF?: boolean;

  /**
   * Experimental feature.
   * Whether to use ICE Aggressive nomination.
   */
  forceAggressiveIceNomination?: boolean;

  /**
   * The maximum average audio bitrate to use, in bits per second (bps) based on
   * [RFC-7587 7.1](https://tools.ietf.org/html/rfc7587#section-7.1). By default, the setting
   * is not used. If you specify 0, then the setting is not used. Any positive integer is allowed,
   * but values outside the range 6000 to 510000 are ignored and treated as 0. The recommended
   * bitrate for speech is between 8000 and 40000 bps as noted in
   * [RFC-7587 3.1.1](https://tools.ietf.org/html/rfc7587#section-3.1.1).
   */
  maxAverageBitrate?: number;

  /**
   * The region code of the region to connect to.
   */
  region?: string;

  /**
   * An RTCConfiguration to pass to the RTCPeerConnection constructor.
   */
  rtcConfiguration?: RTCConfiguration;

  /**
   * A mapping of custom sound URLs by sound name.
   */
  sounds?: Partial<Record<SoundName, string>>;

  /**
   * Whether to enable warn logging.
   */
  warnings?: boolean;
}
