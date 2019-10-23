import nodeFetch from 'node-fetch';
import { Signale } from 'signale';
import { conditionalObjectMerge } from '@xhmm/utils';

enum APIList {
  'send_private_msg' = 'send_private_msg',
  'send_group_msg' = 'send_group_msg',
  'send_msg' = 'send_msg',
  'get_group_list' = 'get_group_list',
  'get_group_member_list' = 'get_group_member_list',
  'get_image' = 'get_image',
}
interface SendPrivateMsgResponse {
  message_id: number;
}
interface SendGroupMsgResponse {
  message_id: number;
}
interface SendMsgResponse {
  message_id: number;
}
type GetGroupListResponse = Array<{
  group_id: number;
  group_name: string;
}>;
type GetGroupMemberListResponse = Array<{
  group_id: number;
  user_id: number;
  nickname: string;
  card: string; // 群名片/备注
  sex: 'male' | 'female' | 'unknown';
  age: number;
  area: string;
  join_time: number;
  last_sent_time: string;
  level: string;
  role: 'owner' | 'admin' | 'member';
  unfriendly: boolean;
  title: string; // 专属头衔
  title_expire_time: number;
  card_changeable: boolean;
}>;
interface GetImageResponse {
  file: string; // 下载后的图片的本地路径
}

class HttpPluginError extends Error {
  private apiName: APIList;
  private retcode?: number;
  constructor(apiName: APIList, message: string, retcode?: number) {
    if (retcode) super(`HTTP Plugin API "${apiName}" called with error message "${message}", retcode is ${retcode}`);
    else super(`HTTP Plugin API "${apiName}" called with error message "${message}"`);
    this.name = this.constructor.name;
    this.apiName = apiName;
    if (retcode) this.retcode = retcode;
    Error.captureStackTrace(this, this.constructor);
  }
}

interface PluginConfig {
  accessToken?: string; // 需要搭配配置文件
}
export class HttpPlugin {
  logger: Signale;
  endpoint: string;
  config: PluginConfig;

  constructor(endpoint: string, config?: PluginConfig) {
    this.logger = new Signale({
      scope: 'coolq-http-api',
    });
    this.endpoint = endpoint;
    this.config = config || {};
  }

  async sendPrivateMsg(personQQ: number, message: string, escape = false): Promise<SendPrivateMsgResponse> {
    return await this.getResponseData<SendPrivateMsgResponse>(APIList.send_private_msg, {
      user_id: personQQ,
      message,
      auto_escape: escape,
    });
  }

  async sendGroupMsg(groupQQ: number, message: string, escape = false): Promise<SendGroupMsgResponse> {
    return await this.getResponseData<SendGroupMsgResponse>(APIList.send_group_msg, {
      group_id: groupQQ,
      message,
      auto_escape: escape,
    });
  }

  async sendMsg(
    numbers: { userNumber?: number; groupNumber?: number; },
    message: string,
    escape = false
  ): Promise<SendMsgResponse> {
    return await this.getResponseData(APIList.send_msg, {
      user_id: numbers.userNumber,
      group_id: numbers.groupNumber,
      message,
      auto_escape: escape,
    });
  }

  async getGroupList(): Promise<GetGroupListResponse> {
    return await this.getResponseData<GetGroupListResponse>(APIList.get_group_list);
  }

  async getGroupMemberList(groupQQ: number): Promise<GetGroupMemberListResponse> {
    return await this.getResponseData<GetGroupMemberListResponse>(APIList.get_group_member_list, {
      group_id: groupQQ,
    });
  }

  async downloadImage(cqFile: string): Promise<GetImageResponse> {
    return await this.getResponseData<GetImageResponse>(APIList.get_image, {
      file: cqFile,
    });
  }

  private async getResponseData<D>(api: APIList, data?: Record<string, any>): Promise<D> {
    try {
      const response = await nodeFetch(`${this.endpoint}/${api}`, {
        headers: conditionalObjectMerge({
          'Content-Type': 'application/json'
        }, [
          this.config.accessToken !== undefined,
          {
            Authorization: `Bearer ${this.config.accessToken}`,
          },
        ]),
        body: JSON.stringify(data)
      });
      if (response.status === 200) {
        // https://cqhttp.cc/docs/#/API?id=%E5%93%8D%E5%BA%94%E8%AF%B4%E6%98%8E
        const { status, retcode, data } = await response.json();
        if (status === 'ok' && retcode === 0) return data;
        let reason = `请前往 https://cqhttp.cc/docs/#/API?id=响应说明 或 酷Q运行日志(不是http插件) 根据状态码${retcode}查询原因`;
        if (status === 'failed') {
          if (retcode === -23) reason = `找不到与目标QQ的关系，消息无法发送`;
          if (retcode === -34) reason = '机器人被禁言了';
          if (retcode === -38) reason = '接收者帐号错误或帐号不在该群组内';
          if (retcode === 100) reason = '参数缺失或参数无效(比如QQ号小于0、message字段无内容等)';
        }
        return Promise.reject(
          new HttpPluginError(api, `response data status is ${status}, reason is ${reason}`, retcode)
        );
      } else {
        return Promise.reject(new HttpPluginError(api, `fetch response status code is ${response.status}`));
      }
    } catch (e) {
      throw new HttpPluginError(api, e.message);
    }
  }
}
