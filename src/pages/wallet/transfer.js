import _ from 'lodash';
import React, { Component } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, Image,
} from 'react-native';
import Slider from '@react-native-community/slider';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import { connect } from 'react-redux';
import color from '../../assets/styles/color';
import fontFamily from '../../assets/styles/font.family';
import RadioGroup from './transfer.radio.group';
import Loc from '../../components/common/misc/loc';
import Switch from '../../components/common/switch/switch';
import {
  createErrorNotification, getErrorNotification, getDefaultTxFailedErrorNotification, getDefaultErrorNotification,
} from '../../common/notification.controller';
import { createErrorConfirmation } from '../../common/confirmation.controller';
import appActions from '../../redux/app/actions';
import walletActions from '../../redux/wallet/actions';
import Transaction, { btcTransaction, rbtcTransaction } from '../../common/transaction';
import common from '../../common/common';
import { strings } from '../../common/i18n';
import Button from '../../components/common/button/button';
import OperationHeader from '../../components/headers/header.operation';
import BasePageGereral from '../base/base.page.general';
import {
  MAX_FEE_TIMES, PLACEHODLER_AMOUNT, NUM_OF_FEE_LEVELS, defaultErrorNotification,
} from '../../common/constants';
import parseHelper from '../../common/parse';
import references from '../../assets/references';
import CancelablePromiseUtil from '../../common/cancelable.promise.util';
import {
  ERROR_CODE, FeeCalculationError, InvalidAddressError, InvalidAmountError,
} from '../../common/error';
import InvalidRskAddressConfirmation from '../../components/wallet/invalid.rskaddress.confirmation';

const MEMO_NUM_OF_LINES = 8;
const MEMO_LINE_HEIGHT = 15;

const styles = StyleSheet.create({
  headerTitle: {
    color: color.whiteA90,
    fontFamily: fontFamily.AvenirMedium,
    fontSize: 20,
    marginLeft: -2,
    marginBottom: 2,
  },
  chevron: {
    color: color.white,
  },
  headImage: {
    position: 'absolute',
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 15,
  },
  buttonView: {
    position: 'absolute',
    bottom: '5%',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  content: {
    alignItems: 'center',
    marginTop: 30,
  },
  check: {
    margin: 25,
  },
  text: {
    color: color.tundora,
    fontSize: 15,
    fontWeight: '300',
    width: '80%',
    marginTop: 15,
    textAlign: 'center',
  },
  link: {
    color: color.app.theme,
  },
  body: {
    flex: 1,
    backgroundColor: color.white,
  },
  sending: {
    color: color.black,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.39,
    marginTop: 20,
  },
  sectionTitle: {
    color: color.black,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.31,
    marginBottom: 10,
    marginTop: 10,
  },
  memo: {
    color: color.black,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.23,
    marginBottom: 10,
    marginTop: 10,
  },
  textInput: {
    color: color.black,
    fontSize: 12,
    fontWeight: '500',
    paddingVertical: 0,
    marginLeft: 5,
    marginVertical: 10,
    flex: 1,
  },
  textInputView: {
    borderColor: color.component.input.borderColor,
    backgroundColor: color.component.input.backgroundColor,
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: 'solid',
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInputIcon: {
    paddingVertical: 5,
    paddingLeft: 5,
    paddingRight: 15,
  },
  question: {
    fontSize: 16,
    fontWeight: '300',
    letterSpacing: 0.31,
    marginBottom: 10,
  },
  radioItem: {
    flexDirection: 'row',
    width: '33%',
  },
  radioItemLeft: {

  },
  radioItemText1: {
    color: color.black,
    fontSize: 16,
    letterSpacing: 0.31,
  },
  radioItemText2: {
    color: color.tundora,
    fontSize: 12,
    fontWeight: '300',
    letterSpacing: 0.23,
  },
  radioCheck: {
    fontSize: 20,
  },
  RadioGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circle: {
    marginTop: 5,
    marginRight: 10,
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: color.silverChalice,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: color.app.theme,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customFeeSlider: {
    width: '100%',
    height: 40,
  },
  customFeeSliderWrapper: {
    height: 60,
    marginTop: 5,
  },
  customFeeText: {
    alignSelf: 'flex-end',
    fontSize: 13,
  },
  customTitle: {
    color: color.black,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.31,
    marginBottom: 10,
    marginTop: 10,
  },
  sendingRow: {
    flexDirection: 'row',
  },
  sendAll: {
    position: 'absolute',
    right: 10,
    bottom: 3,
  },
  sendAllText: {
    color: color.app.theme,
  },
  lastBlockMarginBottom: {
    marginBottom: 15,
  },
  confirmButton: {
    alignSelf: 'center',
  },
  titleView: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 8,
    left: 10,
    alignItems: 'center',
  },
  balance: {
    fontFamily: fontFamily.AvenirRoman,
    color: color.midGrey,
    marginTop: 12,
    marginBottom: 5,
  },
  addressError: {
    color: color.warningText,
    marginTop: 10,
  },
  addressText: {
    color: color.black,
    marginTop: 10,
    fontSize: 12,
  },
});

class Transfer extends Component {
  static navigationOptions = () => ({
    header: null,
    gesturesEnabled: false,
  });

  static generateAmountPlaceholderText(symbol, type, currency, prices) {
    const amountText = common.getBalanceString(PLACEHODLER_AMOUNT, symbol);
    let amountPlaceholderText = `${amountText} ${common.getSymbolName(symbol, type)}`;
    if (!_.isEmpty(prices)) {
      const currencySymbol = common.getCurrencySymbol(currency);
      const amountValue = common.getCoinValue(PLACEHODLER_AMOUNT, symbol, type, currency, prices);
      if (amountValue) {
        const amountValueText = common.getAssetValueString(amountValue);
        amountPlaceholderText += ` (${currencySymbol}${amountValueText})`;
      }
    }
    return amountPlaceholderText;
  }

  constructor(props) {
    super(props);

    const { navigation: { state: { params: { coin, toAddress } } } } = props;
    this.coin = coin;

    this.txFeesCache = {};
    this.isRequestSendAll = false;

    // BTC transfer data
    this.minCustomFee = null;
    this.maxCustomFee = null;

    // Rsk transfer data
    this.gas = null;
    this.minCustomGasPrice = null;
    this.maxCustomGasPrice = null;

    // form data validation state
    this.isAmountValid = false;
    this.isAddressValid = !!toAddress;

    this.toAddress = toAddress;
    this.txSize = null;

    this.confirm = this.confirm.bind(this);
    this.inputAmount = this.inputAmount.bind(this);
    // this.onConfirmSliderVerified = this.onConfirmSliderVerified.bind(this);
    this.onSendAllPress = this.onSendAllPress.bind(this);
    this.onAmountInputBlur = this.onAmountInputBlur.bind(this);
    this.onMemoInputBlur = this.onMemoInputBlur.bind(this);
    this.onAmountInputChangeText = this.onAmountInputChangeText.bind(this);

    this.state = {
      loading: false,
      to: toAddress,
      amount: '',
      memo: null,
      feeLevel: 1,
      // isConfirm: false,
      enableConfirm: false,
      isCustomFee: false,
      customFee: null,
      customFeeValue: new BigNumber(0),
      feeSymbol: null,
      feeSliderValue: 0,
      amountPlaceholderText: '',
      levelFees: null, // [ { fee, value }... ]
      addressError: null,
      addressText: '',
      invalidAddressBalance: undefined,
      invalidAddressModalTitle: undefined,
      invalidAddressModalBody: undefined,
      invalidAddressModalVisible: false,
    };
  }

  componentDidMount() {
    const { to } = this.state;
    this.initContext();
    if (to) {
      this.onToInputBlur();
    }
  }

  componentWillReceiveProps(nextProps) {
    const { prices, currency } = nextProps;
    const { prices: curPrices } = this.props;
    const { symbol, type } = this.coin;

    if (prices && prices !== curPrices) {
      const { customFee, feeSymbol } = this.state;
      const customFeeValue = common.getCoinValue(customFee, feeSymbol, type, currency, prices);
      const amountPlaceholderText = Transfer.generateAmountPlaceholderText(symbol, type, currency, prices);
      this.setState({ customFeeValue, amountPlaceholderText });
    }
  }

  componentWillUnmount() {
    const { removeConfirmation } = this.props;
    removeConfirmation();
    CancelablePromiseUtil.cancel(this);
  }

  onGroupSelect = (index) => {
    const {
      levelFees, isCustomFee, feeLevel, customFee,
    } = this.state;
    this.setState({ feeLevel: index, isCustomFee: false }, () => {
      // When the fee is changed by the user, modify the amount in the text box.
      this.adjustSendAllAmount(levelFees, feeLevel, isCustomFee, customFee);
    });
  }

  onQrcodeScanPress = () => {
    console.log('onQrcodeScanPress');
    const { navigation } = this.props;
    navigation.navigate('Scan', {
      coin: this.coin,
      onDetectedAction: 'backToTransfer',
      onQrcodeDetected: (address) => {
        console.log('onQrcodeDetected, address: ', address);
        // Fill in the address and call onToInputBlur to check the content
        this.setState({ to: address }, () => {
          this.onToInputBlur();
        });
      },
    });
  }

  // async onConfirmSliderVerified() {
  //   this.setState({ isConfirm: true });
  //   await this.confirm();
  // }

  onCustomFeeSwitchValueChange(value) {
    const { customFee } = this.state;
    this.setState({ isCustomFee: value });
    if (customFee) {
      return;
    }
    if (value) {
      const feeSliderValue = 0.5;
      this.setState({ feeSliderValue });
      this.onCustomFeeSlideValueChange(feeSliderValue);
    }
  }

  /**
   * onCustomFeeSlideValueChange
   * @param {number} value slider value, 0-1
   */
  onCustomFeeSlideValueChange = (value) => {
    const {
      levelFees, isCustomFee, feeLevel,
    } = this.state;

    const { customFee: newCustomFee, customFeeValue } = this.calcCustomFee(value);
    this.setState({ customFee: newCustomFee, customFeeValue }, () => {
      // When the fee is changed by the user, modify the amount in the text box.
      this.adjustSendAllAmount(levelFees, feeLevel, isCustomFee, newCustomFee);
    });
  }

  onCustomFeeSlidingComplete = (value) => {
    this.setState({ feeSliderValue: value });
  }

  onSendAllPress() {
    const { symbol, balance } = this.coin;
    // If balance data have not received from server (user enter this page quickly), return without setState.
    if (_.isNil(balance)) {
      return;
    }
    const amount = common.getBalanceString(balance, symbol);
    this.inputAmount(amount, () => {
      if (symbol === 'BTC' || symbol === 'RBTC') {
        this.txFeesCache = {};
      }
      this.isRequestSendAll = true;
      this.isAmountValid = true;
      this.requestFees(true);
    });
  }

  onConfirmPressed = async () => {
    const { symbol, type } = this.coin;
    const { toAddress } = this;
    try {
      const address = symbol === 'BTC' ? toAddress : await this.getRskAddress();
      if (!address) {
        return;
      }

      if (!common.isWalletAddress(address, symbol, type)) {
        throw new InvalidAddressError();
      }

      this.confirmTransactionWithAddress();
    } catch (error) {
      this.addErrorNotification(error);
    } finally {
      this.setState({ loading: false });
    }
  }

  onAmountInputBlur() {
    const { amount } = this.state;
    const { coin } = this;
    this.setState({ enableConfirm: false });
    if (_.isEmpty(amount)) return;

    this.isAmountValid = true;

    const isAmountValid = common.isAmount(amount);
    if (!isAmountValid) {
      this.isAmountValid = false;
      this.showInvalidAmountNotification();
      return;
    }

    if (!coin.balance || coin.balance.isLessThan(amount)) {
      this.isAmountValid = false;
      this.showAmountExceedsNotification();
      return;
    }

    this.requestFees(false);
  }

  onToInputBlur = async () => {
    const { navigation, addConfirmation } = this.props;
    const { to } = this.state;
    const { symbol, type } = this.coin;
    this.setState({ enableConfirm: false });
    if (_.isEmpty(to)) return;
    let address = null;
    this.setState({ addressText: null, addressError: null });
    if (common.isValidRnsSubdomain(to)) {
      console.log(`toAddress[${to}] a rns subdomain.`);
      this.setState({ loading: true });
      try {
        const subdomainAddress = await CancelablePromiseUtil.makeCancelable(parseHelper.querySubdomain(to, type), this);
        if (subdomainAddress) {
          this.setState({ addressText: subdomainAddress });
          address = subdomainAddress;
        } else {
          this.setState({ addressError: strings('page.wallet.transfer.unavailableAddress') });
          return;
        }
      } catch (error) {
        const confirmation = createErrorConfirmation(
          defaultErrorNotification.title,
          defaultErrorNotification.message,
          'button.retry',
          () => this.onToInputBlur(),
          () => navigation.goBack(),
        );
        addConfirmation(confirmation);
      } finally {
        this.setState({ loading: false });
      }
    } else {
      address = to;
    }
    this.isAddressValid = common.isWalletAddress(address, symbol, type);
    if (!this.isAddressValid) {
      this.showInvalidAddressNotification();
      return;
    }
    this.toAddress = address;
    this.requestFees(false);
  }

  onMemoInputBlur() {
    const { symbol } = this.coin;
    // Because the fee of BTC transaction does not depend on memo,
    // changes to memo do not require recalculation of fee.
    if (symbol !== 'BTC') {
      this.setState({ enableConfirm: false });
      this.requestFees(false);
    }
  }

  onAmountInputChangeText(text) {
    // When modifying the amount, set isRequestSendAll to false
    this.isRequestSendAll = false;
    this.inputAmount(text);
  }

  getFeeParams() {
    const {
      levelFees, feeSymbol, isCustomFee, feeLevel, customFee,
    } = this.state;
    let feeParams = null;
    if (feeSymbol === 'BTC') {
      const fee = isCustomFee ? customFee : levelFees[feeLevel].fee;
      feeParams = { fees: common.btcToSatoshiHex(fee) };
    } else {
      const { gas, customGasPrice } = this;
      const gasPrice = isCustomFee ? customGasPrice : levelFees[feeLevel].gasPrice;
      feeParams = { gas, gasPrice: gasPrice.decimalPlaces(0).toString() };
    }
    return feeParams;
  }

  validateAddressBalance = async () => {
    const { symbol, type } = this.coin;
    const { toAddress } = this;
    const { amount } = this.state;
    const explorerName = common.getExplorerName(type);

    this.setState({ loading: true });

    const mainnetBalance = await parseHelper.getBalance({
      type: 'Mainnet', symbol, address: toAddress, needFetch: false,
    });

    const testnetBalance = await parseHelper.getBalance({
      type: 'Testnet', symbol, address: toAddress, needFetch: false,
    });

    const addressBalance = type === 'Mainnet' ? mainnetBalance : testnetBalance;
    const invalidAddressBalance = common.getBalanceString(common.convertUnitToCoinAmount('RBTC', addressBalance), 'RBTC');

    if ((type === 'Mainnet' && mainnetBalance === '0x0') || (type === 'Testnet' && testnetBalance === '0x0')) {
      const invalidAddressModalTitle = strings('modal.emptyRecordAddress.title');
      const symbolName = common.getSymbolName(symbol, type);
      let invalidAddressModalBody = null;
      if (mainnetBalance === '0x0' && testnetBalance === '0x0') {
        invalidAddressModalBody = strings('modal.emptyRecordAddress.body.both', {
          explorerName, symbol, type, symbolName, amount,
        });
      } else {
        const otherType = type === 'Mainnet' ? 'Testnet' : 'Mainnet';
        const otherSymbolName = common.getSymbolName(symbol, otherType);
        const otherTypeBalance = otherType === 'Mainnet' ? mainnetBalance : testnetBalance;
        const balanceAmount = common.convertUnitToCoinAmount('RBTC', otherTypeBalance);
        const balanceText = common.getBalanceString(balanceAmount, 'RBTC');
        invalidAddressModalBody = strings('modal.emptyRecordAddress.body.normal', {
          explorerName, symbol, type, symbolName, amount, otherType, otherSymbolName, balance: balanceText,
        });
      }

      this.setState({
        loading: false,
        invalidAddressBalance,
        invalidAddressModalTitle,
        invalidAddressModalBody,
        invalidAddressModalVisible: true,
      });

      return false;
    }

    return true;
  }

  getRskAddress = async () => {
    const { symbol, type, networkId } = this.coin;
    const { toAddress } = this;
    const explorerName = common.getExplorerName(type);
    const checksumAddress = common.toChecksumAddress(toAddress, networkId);
    if (checksumAddress !== toAddress) {
      const ethereumChecksumAddress = common.toChecksumAddress(toAddress);

      this.setState({ loading: true });

      const balance = await parseHelper.getBalance({
        type, symbol, address: toAddress, needFetch: false,
      });

      const invalidAddressModalTitle = strings('modal.invalidRskAddress.title');
      const invalidAddressModalBody = ethereumChecksumAddress === toAddress
        ? strings('modal.invalidRskAddress.body.ethereum', { explorerName })
        : strings('modal.invalidRskAddress.body.normal', { explorerName });
      const invalidAddressBalance = common.getBalanceString(common.convertUnitToCoinAmount('RBTC', balance), 'RBTC');

      this.setState({
        loading: false,
        invalidAddressBalance,
        invalidAddressModalTitle,
        invalidAddressModalBody,
        invalidAddressModalVisible: true,
      });

      return null;
    }

    const isHasBalance = await this.validateAddressBalance();
    if (!isHasBalance) {
      return null;
    }

    return checksumAddress;
  }

  addErrorNotification = (error) => {
    const { addNotification } = this.props;
    const notification = getErrorNotification(error.code) || getDefaultErrorNotification();
    addNotification(notification);
  }

  /**
   * requestFees
   * This function checks user input and requests fees.
   * If the user input is invalid, the request will not be initiated.
   * Finally, the result of the request will be saved in the page state.
   * @param {*} isAllBalance, Indicates whether the user needs to send the entire balance.
   */
  requestFees = async (isAllBalance) => {
    const { navigation, addConfirmation } = this.props;
    const { amount, to } = this.state;
    const { isAmountValid, isAddressValid, coin } = this;
    const { symbol } = coin;
    try {
      const isValid = !_.isEmpty(amount) && !_.isEmpty(to) && isAmountValid && isAddressValid;
      if (!isValid) {
        return;
      }
      this.setState({ loading: true });
      this.txSize = symbol === 'BTC' ? await this.estimateBtcTxSize(isAllBalance) : null;
      const transactionFees = await this.loadTransactionFees(isAllBalance);
      if (!transactionFees) {
        return;
      }
      this.processFees(transactionFees);
    } catch (error) {
      const confirmation = createErrorConfirmation(
        defaultErrorNotification.title,
        defaultErrorNotification.message,
        'button.retry',
        () => this.requestFees(),
        () => navigation.goBack(),
      );
      addConfirmation(confirmation);
    } finally {
      this.setState({ loading: false });
    }
  }

  estimateBtcTxSize = async (isSendAllBalance) => {
    const { amount } = this.state;
    const { coin, toAddress } = this;
    const { type, privateKey, address } = coin;
    const estimateParams = {
      netType: type,
      amount,
      fromAddress: address,
      destAddress: toAddress,
      privateKey,
      isSendAllBalance,
    };
    return btcTransaction.estimateTxSize(estimateParams);
  }

  confirmTransactionWithAddress = () => {
    const { toAddress } = this;
    const { symbol, networkId } = this.coin;
    const { amount } = this.state;
    try {
      const address = symbol === 'BTC' ? toAddress : common.toChecksumAddress(toAddress, networkId);
      if (!common.isAmount(amount)) {
        throw new InvalidAmountError();
      }

      const { callAuthVerify } = this.props;
      callAuthVerify(() => this.confirm(address), () => null);
    } catch (error) {
      this.addErrorNotification(error);
    }
  }

  onInvalidRskAddressModalConfirmed = () => {
    this.confirmTransactionWithAddress();
    this.setState({ invalidAddressModalVisible: false });
  }

  onInvalidRskAddressModalCanceled = () => {
    this.setState({ invalidAddressModalVisible: false });
  }

  async loadTransactionFees() {
    const { amount, memo } = this.state;
    const {
      coin, txFeesCache, toAddress, txSize,
    } = this;
    const {
      symbol, type, address, precision,
    } = coin;

    if (symbol === 'BTC' && !txSize) {
      throw new FeeCalculationError();
    }

    const { amount: lastAmount, to: lastTo, memo: lastMemo } = txFeesCache;
    const value = common.convertCoinAmountToUnitHex(symbol, amount, precision);
    console.log(`amount: ${amount}, to: ${toAddress}, memo: ${memo}`);
    console.log(`lastAmount: ${lastAmount}, lastTo: ${lastTo}, lastMemo: ${lastMemo}`);

    let isMatched = false;
    if (amount === lastAmount && toAddress === lastTo) {
      if (symbol !== 'BTC') {
        isMatched = memo === lastMemo;
      } else {
        isMatched = true;
      }
    }
    if (isMatched) {
      this.setState({ enableConfirm: true });
      return null;
    }

    const transactionFees = symbol === 'BTC'
      ? await parseHelper.getBtcTransactionFees(symbol, type, txSize)
      : await rbtcTransaction.getTransactionFees(type, coin, address, toAddress, value, memo);
    console.log('transactionFees: ', transactionFees);
    this.txFeesCache = {
      amount, toAddress, memo, transactionFees,
    };
    this.setState({ enableConfirm: true });
    return transactionFees;
  }

  calcCustomFee(value) {
    const { currency, prices } = this.props;
    const { feeSymbol } = this.state;
    const { type } = this.coin;
    let customFeeValue = null;
    let customFee = null;
    if (feeSymbol === 'BTC') {
      const { minCustomFee, maxCustomFee } = this;
      customFee = minCustomFee.plus((maxCustomFee.minus(minCustomFee)).times(value));
      customFeeValue = common.getCoinValue(customFee, feeSymbol, type, currency, prices);
    } else {
      const { minCustomGasPrice, maxCustomGasPrice, gas } = this;
      this.customGasPrice = minCustomGasPrice.plus((maxCustomGasPrice.minus(minCustomGasPrice)).times(value));
      customFee = common.convertUnitToCoinAmount(feeSymbol, this.customGasPrice.times(gas));
      customFeeValue = common.getCoinValue(customFee, feeSymbol, type, currency, prices);
    }
    return { customFee, customFeeValue };
  }

  processFees(transactionFees) {
    console.log('processFees, transactionFees: ', transactionFees);
    const { prices, currency } = this.props;
    const {
      feeSymbol, feeSliderValue, isCustomFee, feeLevel, customFee,
    } = this.state;
    const { coin, txSize } = this;
    const { symbol, type } = coin;

    if (symbol === 'BTC' && !txSize) {
      throw new FeeCalculationError();
    }

    // Calculates levelFees
    const levelFees = [];
    if (feeSymbol === 'BTC') {
      // Calculates BTC levelFees
      const { fees: { low, medium, high } } = transactionFees;
      for (let i = 0; i < NUM_OF_FEE_LEVELS; i += 1) {
        const txFees = [low, medium, high];
        const fee = common.convertUnitToCoinAmount(feeSymbol, txFees[i]);
        const value = common.getCoinValue(fee, feeSymbol, type, currency, prices);
        levelFees.push({ fee, value });
      }
      // # Issue 516 - Minimum sat/byte on fee slider should be 1
      // BTC min custom fee is 1sat/byte. 1sat/byte * bytes = bytes;
      this.minCustomFee = common.satoshiToBtc(txSize);
      this.maxCustomFee = levelFees[NUM_OF_FEE_LEVELS - 1].fee.times(MAX_FEE_TIMES);
    } else {
      // Calculates Rootstock tokens(RBTC, RIF, DOC...) levelFees
      const { gas, gasPrice: { low, medium, high } } = transactionFees;
      this.gas = new BigNumber(gas);
      const txPrices = [low, medium, high];
      for (let i = 0; i < NUM_OF_FEE_LEVELS; i += 1) {
        const gasPrice = new BigNumber(txPrices[i]);
        const gasFee = this.gas.times(gasPrice);
        const fee = common.convertUnitToCoinAmount(feeSymbol, gasFee);
        const value = common.getCoinValue(fee, feeSymbol, type, currency, prices);
        levelFees.push({ fee, value, gasPrice });
      }
      console.log('levelFees: ', levelFees);
      this.minCustomGasPrice = levelFees[0].gasPrice;
      this.maxCustomGasPrice = levelFees[NUM_OF_FEE_LEVELS - 1].gasPrice.times(MAX_FEE_TIMES);
    }

    this.setState({ levelFees });

    let newCustomFee = customFee;

    // Update custom fee
    if (isCustomFee) {
      const { customFee: newFee, customFeeValue } = this.calcCustomFee(feeSliderValue);
      newCustomFee = newFee;
      this.setState({ customFee: newCustomFee, customFeeValue });
    }

    // If user request send all, we need to adjust amount text.
    // We can only use the rest money without fees for transfers
    this.adjustSendAllAmount(levelFees, feeLevel, isCustomFee, newCustomFee);
  }

  adjustSendAllAmount(levelFees, feeLevel, isCustomFee, customFee) {
    const { isRequestSendAll, coin } = this;
    const { symbol, balance } = coin;
    if (!isRequestSendAll || (symbol !== 'BTC' && symbol !== 'RBTC')) {
      return;
    }
    const { feeSymbol } = this.state;
    let restAmount = null;
    if (isCustomFee) {
      restAmount = balance.minus(customFee);
    } else {
      restAmount = balance.minus(levelFees[feeLevel].fee);
    }
    restAmount = restAmount.isGreaterThan(0) ? restAmount : new BigNumber(0);
    const restAmountText = common.getBalanceString(restAmount, feeSymbol);
    this.inputAmount(restAmountText);
    this.txFeesCache.amount = restAmountText;
  }

  initContext() {
    const { prices, currency } = this.props;
    const { symbol, type } = this.coin;
    console.log('prices: ', prices);
    console.log('currency: ', currency);
    const feeSymbol = symbol === 'BTC' ? 'BTC' : 'RBTC';
    const amountPlaceholderText = Transfer.generateAmountPlaceholderText(symbol, type, currency, prices);
    this.setState({ feeSymbol, amountPlaceholderText });
  }

  // resetConfirm() {
  //   this.setState({ isConfirm: false });
  //   this.confirmSlider.reset();
  // }

  showInvalidAddressNotification() {
    const { addNotification } = this.props;
    const notification = createErrorNotification(
      'modal.invalidAddress.title',
      'modal.invalidAddress.body',
    );
    addNotification(notification);
  }

  showInvalidAmountNotification() {
    const { addNotification } = this.props;
    const notification = createErrorNotification(
      'modal.invalidAmount.title',
      'modal.invalidAmount.body',
    );
    addNotification(notification);
  }

  showAmountExceedsNotification() {
    const { addNotification } = this.props;
    const notification = createErrorNotification(
      'modal.amountExceeds.title',
      'modal.amountExceeds.body',
    );
    addNotification(notification);
  }

  async confirm(toAddress) {
    const { navigation, addNotification, getBalance } = this.props;
    const { coin, isRequestSendAll } = this;
    const {
      symbol, type, address, balance, precision,
    } = coin;
    const { memo, amount } = this.state;
    try {
      this.setState({ loading: true });
      const feeParams = this.getFeeParams();
      const extraParams = { data: '', memo, gasFee: feeParams };
      // In order to send all all balances, we cannot use the amount in the text box to calculate the amount sent, but use the coin balance.
      // The amount of the text box is fixed decimal places
      let value = new BigNumber(amount);
      if (isRequestSendAll) {
        if (symbol === 'BTC') {
          value = balance.minus(common.convertUnitToCoinAmount(symbol, feeParams.fees, precision));
        } else if (symbol === 'RBTC') {
          value = balance.minus(common.convertUnitToCoinAmount(symbol, feeParams.gas.times(feeParams.gasPrice), precision));
        } else {
          value = balance;
        }
      }
      let transaction = new Transaction(coin, toAddress, value, extraParams);
      await transaction.broadcast();
      this.setState({ loading: false });
      const completedParams = {
        coin,
        hash: transaction.txHash,
      };
      navigation.navigate('TransferCompleted', completedParams);
      transaction = null;
    } catch (error) {
      this.setState({ loading: false });
      console.log(`confirm, error: ${error.message}`);
      const buttonText = 'button.retry';
      const notification = getErrorNotification(error.code, buttonText) || getDefaultTxFailedErrorNotification(buttonText);
      addNotification(notification);
      if (error.code === ERROR_CODE.NOT_ENOUGH_BALANCE || ERROR_CODE.NOT_ENOUGH_BTC || ERROR_CODE.NOT_ENOUGH_RBTC) {
        getBalance({
          symbol, type, address, needFetch: true,
        });
      }
      // this.resetConfirm();
    }
  }

  inputAmount(text, callback) {
    // Replace comma as dot in argentinian amount input.
    const newText = text.replace(',', '.');
    this.setState({ amount: newText });
    if (parseFloat(newText) >= 0) {
      this.setState({ amount: newText }, () => {
        if (callback) {
          callback();
        }
      });
    }
  }

  renderCustomFee(isCustomFee) {
    const {
      customFee, feeSymbol, customFeeValue, feeSliderValue,
    } = this.state;
    const { type } = this.coin;
    const { currency } = this.props;
    const currencySymbol = common.getCurrencySymbol(currency);
    return (
      <View style={[styles.customFeeSliderWrapper]}>
        { isCustomFee && (
          <View>
            <Slider
              value={feeSliderValue}
              style={styles.customFeeSlider}
              minimumValue={0}
              maximumValue={1}
              minimumTrackTintColor={color.app.theme}
              maximumTrackTintColor={color.grayD8}
              thumbTintColor={color.app.theme}
              onValueChange={(value) => this.onCustomFeeSlideValueChange(value)}
              onSlidingComplete={(value) => this.onCustomFeeSlidingComplete(value)}
            />
            <Text style={styles.customFeeText}>
              {`${common.getBalanceString(customFee, feeSymbol)} ${common.getSymbolName(feeSymbol, type)}`}
              {customFeeValue && ` = ${currencySymbol}${common.getAssetValueString(customFeeValue)}`}
            </Text>
          </View>
        )}
      </View>

    );
  }

  renderFeeOptions() {
    const { currency } = this.props;
    const {
      feeSymbol, feeLevel, isCustomFee, levelFees,
    } = this.state;
    const { type } = this.coin;
    const currencySymbol = common.getCurrencySymbol(currency);
    const items = [];
    for (let i = 0; i < NUM_OF_FEE_LEVELS; i += 1) {
      let item = { coin: `0 ${common.getSymbolName(feeSymbol, type)}`, value: `${currencySymbol}0` };
      if (levelFees) {
        const { fee, value } = levelFees[i];
        const amountText = common.getBalanceString(fee, feeSymbol);
        const valueText = value ? `${currencySymbol}${common.getAssetValueString(value)}` : '';
        item = { coin: `${amountText} ${common.getSymbolName(feeSymbol, type)}`, value: valueText };
      }
      items.push(item);
    }

    let selectIndex = null;
    if (!isCustomFee) {
      selectIndex = feeLevel;
    }
    return (
      <RadioGroup
        isDisabled={isCustomFee}
        data={items}
        selectIndex={selectIndex}
        onChange={(i) => this.onGroupSelect(i)}
      />
    );
  }

  renderMemo(memo) {
    const paddingBottom = 4;
    return (
      <TextInput
        style={[styles.textInput, { textAlignVertical: 'top', paddingBottom }]}
        placeholder={strings('page.wallet.transfer.enterMemo')}
        multiline
        numberOfLines={Platform.OS === 'ios' ? null : MEMO_NUM_OF_LINES}
        minHeight={(Platform.OS === 'ios' && MEMO_NUM_OF_LINES) ? (MEMO_LINE_HEIGHT * MEMO_NUM_OF_LINES + paddingBottom) : null}
        value={memo}
        onChange={(event) => this.setState({ memo: event.nativeEvent.text })}
        onBlur={this.onMemoInputBlur}
      />
    );
  }

  renderAddressText = () => {
    const { addressError, addressText } = this.state;
    if (addressError) {
      return (
        <Text style={styles.addressError}>
          {addressError}
        </Text>
      );
    }
    if (addressText) {
      return (
        <Text style={styles.addressText}>
          {addressText}
        </Text>
      );
    }
    return null;
  }

  render() {
    const {
      loading, to, amount, memo, /* isConfirm, */ isCustomFee, amountPlaceholderText,
      enableConfirm, levelFees, invalidAddressBalance, invalidAddressModalTitle, invalidAddressModalBody, invalidAddressModalVisible,
    } = this.state;
    const { navigation, currency, prices } = this.props;
    const { coin, toAddress } = this;
    const symbol = coin && coin.symbol;
    const type = coin && coin.type;
    const symbolName = common.getSymbolName(symbol, type);
    const title = `${strings('button.Send')} ${symbolName}`;
    let balanceText = '-';
    let balanceValueText = '-';
    if (coin && coin.balance) {
      balanceText = common.getBalanceString(coin.balance, symbol);
      const balanceValue = common.getCoinValue(coin.balance, symbol, type, currency, prices);
      balanceValueText = common.getAssetValueString(balanceValue) || '0';
    }

    return (
      <BasePageGereral
        isSafeView
        hasBottomBtn={false}
        hasLoader
        isLoading={loading}
        headerComponent={<OperationHeader title={title} onBackButtonPress={() => navigation.goBack()} />}
      >
        <View style={styles.body}>
          <View style={styles.sectionContainer}>
            <View style={styles.sendingRow}>
              <Loc style={[styles.sending]} text="txState.Sending" />
              <TouchableOpacity style={[styles.sendAll]} onPress={this.onSendAllPress}><Loc style={[styles.sendAllText]} text="button.sendAll" /></TouchableOpacity>
            </View>
            <View><Text style={styles.balance}>{`${strings('page.wallet.transfer.balance')}: ${balanceText} ${common.getSymbolName(symbol, type)} (${common.getCurrencySymbol(currency)}${balanceValueText})`}</Text></View>
            <View style={styles.textInputView}>
              <TextInput
                placeholder={amountPlaceholderText}
                style={[styles.textInput]}
                value={amount}
                keyboardType="numeric"
                onChangeText={this.onAmountInputChangeText}
                onBlur={this.onAmountInputBlur}
              />
            </View>
          </View>
          <View style={styles.sectionContainer}>
            <Loc style={[styles.sectionTitle]} text="page.wallet.transfer.to" />
            <View style={styles.textInputView}>
              <TextInput
                style={[styles.textInput]}
                value={to}
                onChangeText={(text) => { this.setState({ to: text.trim() }); }}
                onBlur={this.onToInputBlur}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.textInputIcon} onPress={this.onQrcodeScanPress}>
                <Image source={references.images.scanAddress} />
              </TouchableOpacity>
            </View>
            {this.renderAddressText()}
          </View>
          <View style={styles.sectionContainer}>
            <Loc style={[styles.memo]} text="page.wallet.transfer.memo" />
            <View style={styles.textInputView}>
              {this.renderMemo(memo)}
            </View>
          </View>
          <View style={[styles.sectionContainer, { marginBottom: 15 }]}>
            <Loc style={[styles.sectionTitle, { marginBottom: 5 }]} text="page.wallet.transfer.fee" />
            <Loc style={[styles.question]} text="page.wallet.transfer.feeQuestion" />
            {this.renderFeeOptions()}
          </View>
          <View style={[styles.sectionContainer]}>
            <View style={[styles.customRow]}>
              <Loc style={[styles.customTitle, { flex: 1 }]} text="page.wallet.transfer.custom" />
              <Switch
                disabled={!levelFees}
                value={isCustomFee}
                onValueChange={(v) => this.onCustomFeeSwitchValueChange(v)}
              />
            </View>
            {this.renderCustomFee(isCustomFee)}
          </View>
        </View>
        <View
          style={[styles.sectionContainer, {
            opacity: enableConfirm ? 1 : 0.5,
            width: '100%',
            justifyContent: 'center',
          }, styles.lastBlockMarginBottom]}
          pointerEvents={enableConfirm ? 'auto' : 'none'}
        >
          {/*
                // Replace ConfirmSlider with Button component temporaryly.
                <ConfirmSlider // All parameter should be adjusted for the real case
                ref={(ref) => { this.confirmSlider = ref; }}
                width={screen.width - 50}
                buttonSize={(screen.width - 50) / 8}
                buttonColor="transparent" // color for testing purpose, make sure use proper color afterwards
                borderColor="transparent" // color for testing purpose, make sure use proper color afterwards
                backgroundColor="#f3f3f3" // color for testing purpose, make sure use proper color afterwards
                textColor="#37474F" // color for testing purpose, make sure use proper color afterwards
                borderRadius={(screen.width - 50) / 16}
                okButton={{ visible: true, duration: 400 }}
                  // onVerified={this.onConfirmSliderVerified}
                onVerified={async () => {
                  if (global.passcode) {
                    showPasscode('verify', this.onConfirmSliderVerified, this.confirmSlider.reset);
                  } else {
                    await this.onConfirmSliderVerified();
                  }
                }}
                icon={(
                  <Image
                    source={isConfirm ? circleCheckIcon : circleIcon}
                    style={{ width: 32, height: 32 }}
                  />
                  )}
                label={isConfirm ? strings('page.wallet.transfer.CONFIRMED') : strings('page.wallet.transfer.slideConfirm')}
              /> */}
          <Button style={styles.confirmButton} text="button.confirm" onPress={this.onConfirmPressed} />
        </View>
        { invalidAddressModalVisible && (
          <InvalidRskAddressConfirmation
            title={invalidAddressModalTitle}
            body={invalidAddressModalBody}
            ref={(ref) => { this.invalidRskAddressModal = ref; }}
            data={{
              balance: invalidAddressBalance, symbol, type, address: toAddress,
            }}
            onConfirm={this.onInvalidRskAddressModalConfirmed}
            onCancel={this.onInvalidRskAddressModalCanceled}
          />
        )}
      </BasePageGereral>
    );
  }
}

Transfer.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    goBack: PropTypes.func.isRequired,
    state: PropTypes.object.isRequired,
  }).isRequired,
  addNotification: PropTypes.func.isRequired,
  addConfirmation: PropTypes.func.isRequired,
  removeConfirmation: PropTypes.func.isRequired,
  prices: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  currency: PropTypes.string.isRequired,
  callAuthVerify: PropTypes.func.isRequired,
  getBalance: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  prices: state.Price.get('prices'),
  currency: state.App.get('currency'),
  wallets: state.Wallet.get('walletManager') && state.Wallet.get('walletManager').wallets,
  language: state.App.get('language'),
  isFingerprint: state.App.get('fingerprint'),
  passcode: state.App.get('passcode'),
  updateTimestamp: state.Wallet.get('updateTimestamp'),
});

const mapDispatchToProps = (dispatch) => ({
  addNotification: (notification) => dispatch(
    appActions.addNotification(notification),
  ),
  callAuthVerify: (callback, fallback) => dispatch(
    appActions.callAuthVerify(callback, fallback),
  ),
  addConfirmation: (confirmation) => dispatch(
    appActions.addConfirmation(confirmation),
  ),
  removeConfirmation: () => dispatch(appActions.removeConfirmation()),
  showPasscode: (category, callback, fallback) => dispatch(
    appActions.showPasscode(category, callback, fallback),
  ),
  getBalance: (params) => dispatch(walletActions.getBalance(params)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Transfer);
