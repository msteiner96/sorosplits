import Image from "next/image"
import Text from "../Text"
import Card from "./Card"
import clsx from "clsx"
import { useEffect, useState } from "react"
import useToken from "@/hooks/contracts/useToken"
import { WhitelistedTokensCardData } from "./WhitelistedTokens"
import { getBalance } from "@/utils/getBalance"
import useSplitter from "@/hooks/contracts/useSplitter"
import useAppStore from "@/store/index"
import { errorToast, loadingToast } from "@/utils/toast"

interface TokenBalancesCardProps {
  data: WhitelistedTokensCardData[]
  isDiversifierActive: boolean
  diversifierContractAddress: string
  splitterContractAddress: string
}

const TokenBalancesCard: React.FC<TokenBalancesCardProps> = ({
  data,
  isDiversifierActive,
  diversifierContractAddress,
  splitterContractAddress,
}) => {
  const token = useToken()
  const splitter = useSplitter()
  const { walletAddress, setLoading, isConnected } = useAppStore()

  const [allocation, setAllocation] = useState<string[]>([])
  const [waitingForDistribution, setWaitingForDistribution] = useState<
    string[]
  >([])

  useEffect(() => {
    if (data.length === 0) return

    fetchBalanceData()
  }, [data, diversifierContractAddress, walletAddress])

  const fetchBalanceData = async () => {
    const allocationRes = walletAddress
      ? await Promise.all(
          data.map((item) => {
            return splitter.query.getAllocation(
              splitterContractAddress,
              item.address,
              walletAddress
            )
          })
        )
      : data.map(() => BigInt(0))
    setAllocation(
      walletAddress
        ? allocationRes.map((item, index) => {
            return getBalance(item, data[index].decimals).toFixed(2)
          })
        : allocationRes.map(() => "-")
    )

    // TODO: Think about what to show for balance

    const diversifierTotalRes = await Promise.all(
      data.map((item) => {
        return token.query.getBalance(item.address, diversifierContractAddress)
      })
    )

    if (isDiversifierActive) {
      setWaitingForDistribution(
        diversifierTotalRes.map((item, index) => {
          return getBalance(item, data[index].decimals).toFixed(2)
        })
      )
    } else {
      const unusedRes = await Promise.all(
        data.map((item) => {
          return splitter.query.getUnusedTokens(
            splitterContractAddress,
            item.address
          )
        })
      )
      let total = []
      for (let i = 0; i < data.length; i++) {
        total.push(diversifierTotalRes[i] + unusedRes[i])
      }
      setWaitingForDistribution(
        total.map((item, index) => {
          return getBalance(item, data[index].decimals).toFixed(2)
        })
      )
    }
  }

  const handleWithdrawAllocation = async (index: number) => {
    try {
      setLoading(true)

      if (!isConnected) throw new Error("Please connect your wallet.")

      loadingToast("Withdrawal in progress...")

      await splitter.call.withdrawAllocation(
        splitterContractAddress,
        data[index].address,
        walletAddress || "",
        1000
      )

      loadingToast("Withdrawal successful")

      await fetchBalanceData()
    } catch (error: any) {
      setLoading(false)
      errorToast(error)
    }
  }

  const handleTransferTokens = async (index: number) => {
    try {
      setLoading(true)

      if (!isConnected) throw new Error("Please connect your wallet.")

      loadingToast("Transfer in progress...")

      await splitter.call.transferTokens(
        diversifierContractAddress,
        data[index].address,
        walletAddress || "",
        50000000
      )

      loadingToast("Transfer successful")

      await fetchBalanceData()
    } catch (error: any) {
      setLoading(false)
      errorToast(error)
    }
  }

  const handleDistributeTokens = async (index: number) => {
    try {
      setLoading(true)

      if (!isConnected) throw new Error("Please connect your wallet.")

      loadingToast("Distribution in progress...")

      await splitter.call.distributeTokens(
        diversifierContractAddress,
        data[index].address,
        50000000
      )

      loadingToast("Distribution successful")

      await fetchBalanceData()
    } catch (error: any) {
      setLoading(false)
      errorToast(error)
    }
  }

  return (
    <Card>
      <div className="flex justify-between">
        <Text
          text="Token Balances"
          size="14"
          lineHeight="16"
          letterSpacing="-1.5"
          color="#687B8C"
        />
        <div className="flex items-center gap-8">
          <Text
            text="My Allocation"
            size="14"
            lineHeight="16"
            letterSpacing="-1.5"
            color="#687B8C"
          />
          {/* <Text
            text="Unallocated"
            size="14"
            lineHeight="16"
            letterSpacing="-1.5"
            color="#687B8C"
          /> */}
          <Text
            text="Waiting for Distribution"
            size="14"
            lineHeight="16"
            letterSpacing="-1.5"
            color="#687B8C"
          />
        </div>
      </div>

      <div className="flex flex-col mt-3 gap-1">
        {data.length === 0 && (
          <div className="flex w-full gap-3">
            <Image
              src="/icons/info.svg"
              height={12}
              width={12}
              alt="Info icon"
            />
            <Text
              text="This contract does not have any whitelisted tokens"
              size="12"
              color="#687B8C"
            />
          </div>
        )}
        {data.map((item, index) => {
          return (
            <div
              key={item.address}
              className={clsx(
                "h-[28px] w-full rounded-[8px] flex justify-between items-center px-1"
                // "hover:bg-[#EBF2F7] hover:cursor-pointer"
              )}
            >
              {/* <button
                onClick={() => handleWithdrawAllocation(index)}
                className="text-[10px] bg-[#F2F2F2] text-[#687B8C] px-2 py-1 rounded-[8px] hover:bg-[#EBF2F7]"
              >
                WA
              </button>
              <button
                onClick={() => handleTransferTokens(index)}
                className="text-[10px] bg-[#F2F2F2] text-[#687B8C] px-2 py-1 rounded-[8px] hover:bg-[#EBF2F7]"
              >
                TT
              </button>
              <button
                onClick={() => handleDistributeTokens(index)}
                className="text-[10px] bg-[#F2F2F2] text-[#687B8C] px-2 py-1 rounded-[8px] hover:bg-[#EBF2F7]"
              >
                DT
              </button> */}
              <Text
                text={item.name}
                size="12"
                lineHeight="12"
                letterSpacing="-1.5"
              />
              <div className="flex items-center">
                <Text
                  text={allocation[index]}
                  size="12"
                  lineHeight="12"
                  letterSpacing="-1.5"
                />
                {/* <div className="w-[110px] flex justify-end">
                  <Text
                    text={unused[index]}
                    size="12"
                    lineHeight="12"
                    letterSpacing="-1.5"
                  />
                </div> */}
                {/* <div className="w-[65px] flex justify-end"> */}
                <div className="w-[190px] flex justify-end">
                  <Text
                    text={waitingForDistribution[index]}
                    size="12"
                    lineHeight="12"
                    letterSpacing="-1.5"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export default TokenBalancesCard
