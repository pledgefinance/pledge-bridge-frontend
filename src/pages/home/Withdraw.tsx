import { AlertText, Footer, FormHeader, FormWapper, Label } from '@/components/styleComponents';
import currencyInfos from '@/constants/currencyInfos';
import { useCountdown, useFetchBalance } from '@/hooks';
import { currencyState } from '@/model/global';
import services from '@/services';
import { lockedCountdown } from '@/services/pledge/api/lockedCountdown';
import { divided_18, multiplied_18, numeralStandardFormat_4 } from '@/utils/public';
import { useWeb3React } from '@web3-react/core';
import { Button } from 'antd';
import { get } from 'lodash';
import numeral from 'numeral';
import React, { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import styled from 'styled-components';
import AmountInput from './AmountInput';
import Balance from './Balance';
import ConfirmDrawer from './ConfirmDrawer';
import LinkToHistory from './LinkToHistory';

const WithdrawBar = styled.div`
  margin: 30px 0;
  padding: 20px;
  width: 100%;
  height: 94px;
  background: rgba(93, 82, 255, 0.1);
  border: 1px solid #5d52ff;
  box-sizing: border-box;
  border-radius: 10px;
  display: flex;
  justify-content: space-around;
  .divider {
    flex: 1 0 auto;
    text-align: center;
    > div {
      display: inline-block;
      width: 1px;
      height: 100%;
      background: #5d52ff;
    }
  }
`;

const WithdrawBarItem = styled.div`
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #5d52ff;
  > span {
    font-size: 12px;
    text-align: center;
  }
  > div {
    font-weight: bold;
    font-size: 24px;
    text-align: center;
  }
`;

const FlexDiv = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  > div {
    flex: 1 0 50%;
  }
`;

const WithdrawShowItem = styled.div<{ textAlign?: 'left' | 'right' }>`
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  text-align: ${(props) => (props.textAlign === 'right' ? 'right' : 'unset')};
  > span {
    padding-bottom: 10px;
    color: #8b89a3;
    font-size: 14px;
  }
  > div {
    color: #262533;
    font-weight: 600;
    font-size: 20px;
  }
`;

export default () => {
  const currency = useRecoilValue(currencyState);
  const { account } = useWeb3React();
  const [amount, setAmount] = useState<string>();
  const [countdown, setCountdown] = useCountdown();
  const [mplgrAmounts, setMplgrAmounts] = useState<string>();
  const [plgrAmounts, setPlgrAmounts] = useState<string>();
  const [lockedPlgr, setLockedPlgr] = useState<string>();
  const [totalTransferAmount, setTotalTransferAmount] = useState<number>();
  const [approveLoading, setApproveLoading] = useState<boolean>(false);
  const [drawerElement, setDrawerElement] = useState<JSX.Element | undefined>();
  const fetchBalance = useFetchBalance();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchAndSetCountDown = async () => {
    const result = await lockedCountdown();
    const newCountDown = get(result, ['timestamp'], 0);
    if (newCountDown) {
      setCountdown(newCountDown);
    }
  };

  const fetchInitalData = async () => {
    try {
      const newMplgrAmounts = await services.evmServer.mplgr_amounts(account!);
      setMplgrAmounts(divided_18(newMplgrAmounts));
    } catch (error) {
      console.log(error);
    }

    try {
      const newPlgrAmounts = await services.evmServer.plgr_amounts(account!);
      setPlgrAmounts(divided_18(newPlgrAmounts));
    } catch (error) {
      console.log(error);
    }

    try {
      const locked_plgr_tx = await services.evmServer.locked_plgr_tx(account!);
      setLockedPlgr(divided_18(get(locked_plgr_tx, 'amount')));
    } catch (error) {
      console.log(error);
    }

    try {
      const newTotalTransferAmount = await services.evmServer.totalTransferAmount();
      setTotalTransferAmount(newTotalTransferAmount);
    } catch (error) {
      console.log(error);
    }
  };

  const resetState = () => {
    setAmount('');
    fetchInitalData();
    fetchBalance();
  };

  const handleCallback = () => {
    resetState();
  };

  const showDrawerElement = () => {
    setDrawerElement(
      <ConfirmDrawer
        key={new Date().getTime().toString()}
        title="Withdraw Confirm"
        amount={amount}
        account={account}
        transferredType="withdraw"
        callback={handleCallback}
      />,
    );
  };

  const handleClickApprove = async () => {
    setApproveLoading(true);
    const contractAmount = multiplied_18(amount!)!;
    try {
      await services.evmServer.approve(
        get(currencyInfos, [currency, 'contractAddress']),
        get(currencyInfos, [currency, 'pledgerBridgeContractAddress']),
        contractAmount,
      );
      showDrawerElement();
    } catch (error) {
      console.log(error);
    }
    setApproveLoading(false);
  };

  const handleChangeInput: React.InputHTMLAttributes<HTMLInputElement>['onChange'] = (v) => {
    setAmount(v.target.value);
  };

  const handleClickMax = () => {
    if (currency === 'BSC') {
      setAmount(plgrAmounts);
    } else {
      setAmount(mplgrAmounts);
    }
  };

  useEffect(() => {
    setAmount('');
  }, [currency]);

  useEffect(() => {
    if (account) {
      fetchInitalData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, currency]);

  useEffect(() => {
    if (countdown === 0) {
      fetchInitalData();
      // fetchAndSetCountDown();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  useEffect(() => {
    // fetchAndSetCountDown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {drawerElement}
      <FormWapper>
        <FormHeader>
          <span>Withdraw</span>
          <div>
            <a>
              <img src={require('@/assets/images/ic24-help.svg')} alt="" />
            </a>
            <LinkToHistory type="withdraw" account={account!} />
          </div>
        </FormHeader>
        <WithdrawBar>
          <WithdrawBarItem>
            <span>Total Transfer Amount</span>
            <div>{numeral(totalTransferAmount).format('0,0')} PLGR</div>
          </WithdrawBarItem>
        </WithdrawBar>

        <FlexDiv>
          <WithdrawShowItem>
            <span>APY</span>
            <div>166.67% </div>
            {/* {countdown} */}
          </WithdrawShowItem>
          <WithdrawShowItem textAlign="right">
            <span>Lock PLGR</span>
            <div>{numeralStandardFormat_4(lockedPlgr)} PLGR</div>
          </WithdrawShowItem>
          <WithdrawShowItem>
            <span>Withdrawal PLGR</span>
            <div>{numeralStandardFormat_4(plgrAmounts)} PLGR</div>
          </WithdrawShowItem>
          <WithdrawShowItem textAlign="right">
            <span>Withdrawal MPLGR</span>
            <div>{numeralStandardFormat_4(mplgrAmounts)} MPLGR</div>
          </WithdrawShowItem>
        </FlexDiv>

        <Label>Amount</Label>
        <AmountInput
          // placeholder={`Minimum amount is 0.1 ${get(currencyInfos, [currency, 'currencyName'])}`}
          onChange={handleChangeInput}
          onClickMax={handleClickMax}
          value={amount}
        />
        <Balance />
        <Button
          type="primary"
          className='submitButton'
          onClick={handleClickApprove}
          loading={approveLoading}
        >
          Approve
        </Button>
        <AlertText>
          <img src={require('@/assets/images/alert.svg')} alt="" />
          <span>The bridge crossing time is 0:00 UTC every Sunday, please wait 30-60 min</span>
        </AlertText>
      </FormWapper>
      <Footer />
    </>
  );
};
