import { MCPResponse, ResponseType } from "../tools/types.js";
import {
  returnAvailableFunctions,
  returnCheckBalanceSuccess,
  returnContractDeployedSuccessfully,
  returnContractReadSuccessfully,
  returnContractVerifiedSuccessfully,
  returnErrorCheckingBalance,
  returnErrorCheckingTransaction,
  returnErrorContractNotVerified,
  returnErrorDeployingContract,
  returnErrorInvalidABI,
  returnErrorInvalidBytecode,
  returnErrorInvalidContractAddress,
  returnErrorInvalidJSON,
  returnErrorInvalidWalletData,
  returnErrorMissingInfo,
  returnErrorReadingContract,
  returnErrorReadingPasswordFile,
  returnErrorTryAgain,
  returnErrorTXHashInvalid,
  returnErrorTXIdRequired,
  returnErrorTxNotFound,
  returnErrorVerifyingContract,
  returnInteractionResponse,
  returnToCheckBalance,
  returnToDeployContract,
  returnToReadContract,
  returnToVerifyContract,
  returnTransactionFound,
  returnWalletCreatedSuccessfully,
} from "../utils/responses.js";

export function provideResponse(
  content: string,
  type: ResponseType
): MCPResponse {
  const text = responseText(content, type);
  const isError = (type as string).startsWith("error");
  return {
    content: [
      {
        type: "text",
        text: text as string,
      },
    ],
    ...(isError && { isError: true }),
  };
}

function responseText(content: string, type: ResponseType) {
  switch (type) {
    case ResponseType.Interaction:
      return returnInteractionResponse(content);
    case ResponseType.ErrorReadingPasswordFile:
      return returnErrorReadingPasswordFile(content);
    case ResponseType.ErrorMissingInfo:
      return returnErrorMissingInfo(content);
    case ResponseType.WalletCreatedSuccessfully:
      return returnWalletCreatedSuccessfully(content);
    case ResponseType.ErrorTryAgain:
      return returnErrorTryAgain(content);
    case ResponseType.ToCheckBalance:
      return returnToCheckBalance(content);
    case ResponseType.ErrorInvalidWalletData:
      return returnErrorInvalidWalletData(content);
    case ResponseType.CheckBalanceSuccess:
      return returnCheckBalanceSuccess(content);
    case ResponseType.ErrorCheckingBalance:
      return returnErrorCheckingBalance(content);
    case ResponseType.ErrorTXIdRequired:
      return returnErrorTXIdRequired();
    case ResponseType.ErrorTXHashInvalid:
      return returnErrorTXHashInvalid(content);
    case ResponseType.TransactionFound:
      return returnTransactionFound(content);
    case ResponseType.ErrorTxNotFound:
      return returnErrorTxNotFound(content);
    case ResponseType.ErrorCheckingTransaction:
      return returnErrorCheckingTransaction(content);
    case ResponseType.ToDeployContract:
      return returnToDeployContract(content);
    case ResponseType.ContractDeployedSuccessfully:
      return returnContractDeployedSuccessfully(content);
    case ResponseType.ErrorDeployingContract:
      return returnErrorDeployingContract(content);
    case ResponseType.ErrorInvalidABI:
      return returnErrorInvalidABI(content);
    case ResponseType.ErrorInvalidBytecode:
      return returnErrorInvalidBytecode(content);
    case ResponseType.ToVerifyContract:
      return returnToVerifyContract(content);
    case ResponseType.ContractVerifiedSuccessfully:
      return returnContractVerifiedSuccessfully(content);
    case ResponseType.ErrorVerifyingContract:
      return returnErrorVerifyingContract(content);
    case ResponseType.ErrorInvalidContractAddress:
      return returnErrorInvalidContractAddress(content);
    case ResponseType.ErrorInvalidJSON:
      return returnErrorInvalidJSON(content);
    case ResponseType.ToReadContract:
      return returnToReadContract(content);
    case ResponseType.ContractReadSuccessfully:
      return returnContractReadSuccessfully(content);
    case ResponseType.ErrorReadingContract:
      return returnErrorReadingContract(content);
    case ResponseType.ErrorContractNotVerified:
      return returnErrorContractNotVerified(content);
    case ResponseType.AvailableFunctions:
      return returnAvailableFunctions(content);
    default:
      return content;
  }
}
