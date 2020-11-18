"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUploadLink = void 0;
const react_native_background_upload_1 = require("react-native-background-upload");
const apollo_link_1 = require("apollo-link");
const apollo_link_http_common_1 = require("apollo-link-http-common");
const printer_1 = require("graphql/language/printer");
const extractFiles_1 = require("extract-files/public/extractFiles");
const isExtractableFile_1 = require("extract-files/public/isExtractableFile");
const createUploadPromise = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const uploadId = yield react_native_background_upload_1.default.startUpload(options);
    const response = yield new Promise((resolve, reject) => {
        const errorHandler = (data) => reject(data.error);
        react_native_background_upload_1.default.addListener("error", uploadId, errorHandler);
        react_native_background_upload_1.default.addListener("cancelled", uploadId, errorHandler);
        react_native_background_upload_1.default.addListener("completed", uploadId, (data) => resolve(JSON.parse(data.responseBody)));
    });
    return response;
});
exports.createUploadLink = ({ uri, isExtractableFile: customIsExtractableFile = isExtractableFile_1.default, includeExtensions = false, headers = {}, }) => {
    const linkConfig = {
        http: { includeExtensions },
        options: {},
        headers,
    };
    return new apollo_link_1.ApolloLink((operation) => {
        const context = operation.getContext();
        const { clientAwareness: { name = null, version = null } = {}, headers: contextHeaders, } = context;
        const contextConfig = {
            http: context.http,
            options: context.fetchOptions,
            credentials: context.credentials,
            headers: Object.assign(Object.assign(Object.assign({}, (name && { "apollographql-client-name": name })), (version && { "apollographql-client-version": version })), contextHeaders),
        };
        const { body } = apollo_link_http_common_1.selectHttpOptionsAndBody(operation, apollo_link_http_common_1.fallbackHttpConfig, linkConfig, contextConfig);
        const { files } = extractFiles_1.default(body, "", customIsExtractableFile);
        const map = {};
        let i = 0;
        files.forEach((paths) => {
            map[++i] = paths;
        });
        const operations = {
            query: printer_1.print(operation.query),
            variables: operation.variables,
            operationName: operation.operationName,
        };
        const parts = [];
        files.forEach((paths, file) => {
            console.log(paths, file);
        });
        const options = {
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
        return apollo_link_1.fromPromise(createUploadPromise(options));
    });
};
exports.default = exports.createUploadLink;
//# sourceMappingURL=createUploadLink.js.map