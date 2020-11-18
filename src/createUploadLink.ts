import Upload, { MultipartUploadOptions } from "react-native-background-upload";
import { ApolloLink, fromPromise } from "apollo-link";
import {
  selectHttpOptionsAndBody,
  fallbackHttpConfig,
} from "apollo-link-http-common";
import { print } from "graphql/language/printer";
import extractFiles from "extract-files/public/extractFiles";
import isExtractableFile from "extract-files/public/isExtractableFile";

type URI = string;

const createUploadPromise = async (options: MultipartUploadOptions) => {
  const uploadId = await Upload.startUpload(options);

  const response = await new Promise((resolve, reject) => {
    const errorHandler = (data) => reject(data.error);

    Upload.addListener("error", uploadId, errorHandler);
    Upload.addListener("cancelled", uploadId, errorHandler);
    Upload.addListener("completed", uploadId, (data) =>
      resolve(JSON.parse(data.responseBody)),
    );
  });

  return response;
};

export interface UploadLinkOptions {
  uri: URI;
  isExtractableFile?: (file: any) => boolean;
  includeExtensions?: boolean;
  headers?: Record<string, string>;
}

export const createUploadLink: (options: UploadLinkOptions) => ApolloLink = ({
  uri,
  isExtractableFile: customIsExtractableFile = isExtractableFile,
  includeExtensions = false,
  headers = {},
}) => {
  const linkConfig = {
    http: { includeExtensions },
    options: {}, // ???: Populate this?,
    headers,
  };

  return new ApolloLink((operation) => {
    const context = operation.getContext();
    const {
      clientAwareness: { name = null, version = null } = {},
      headers: contextHeaders,
    } = context;

    const contextConfig = {
      http: context.http,
      options: context.fetchOptions,
      credentials: context.credentials,
      headers: {
        // Client awareness headers can be overridden by context `headers`.
        ...(name && { "apollographql-client-name": name }),
        ...(version && { "apollographql-client-version": version }),
        ...contextHeaders,
      },
    };

    const { body } = selectHttpOptionsAndBody(
      operation,
      fallbackHttpConfig,
      linkConfig,
      contextConfig,
    );

    const { files } = extractFiles(body, "", customIsExtractableFile);
    const map = {};
    let i = 0;
    files.forEach((paths) => {
      // eslint-disable-next-line no-plusplus
      map[++i] = paths;
    });

    const operations = {
      query: print(operation.query),
      variables: operation.variables,
      operationName: operation.operationName,
    };

    const parts = [];
    files.forEach((paths, file) => {
      // eslint-disable-next-line no-console
      console.log(paths, file);
    });

    const options: MultipartUploadOptions = {
      headers,
      parts,
      parameters: {
        operations: JSON.stringify(operations),
        map: JSON.stringify(map),
      },
      url: uri,
      type: "multipart",
      method: "POST",
    };

    return fromPromise(createUploadPromise(options));
  });
};

export default createUploadLink;
