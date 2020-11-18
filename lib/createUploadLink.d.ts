import { ApolloLink } from "apollo-link";
declare type URI = string;
export interface UploadLinkOptions {
    uri: URI;
    isExtractableFile?: (file: any) => boolean;
    includeExtensions?: boolean;
    headers?: Record<string, string>;
}
export declare const createUploadLink: (options: UploadLinkOptions) => ApolloLink;
export default createUploadLink;
