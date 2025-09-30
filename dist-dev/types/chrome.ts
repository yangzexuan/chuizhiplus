/**
 * Chrome扩展API类型扩展
 */

/**
 * 消息接口
 */
export interface ChromeMessage {
    type: string;
    [key: string]: any;
}

/**
 * 消息响应接口
 */
export interface ChromeMessageResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Service Worker消息类型
 */
export type MessageType =
    // 标签页操作
    | 'GET_ALL_TABS'
    | 'GET_TAB'
    | 'MOVE_TAB'
    | 'CLOSE_TAB'
    | 'CREATE_TAB'
    // 窗口操作
    | 'GET_ALL_WINDOWS'
    | 'GET_CURRENT_WINDOW'
    // 存储操作
    | 'STORAGE_GET'
    | 'STORAGE_SET'
    | 'STORAGE_REMOVE'
    | 'STORAGE_CLEAR';

/**
 * 发送消息到Service Worker
 */
export async function sendMessageToBackground<T = any>(
    message: ChromeMessage
): Promise<ChromeMessageResponse<T>> {
    try {
        const response = await chrome.runtime.sendMessage(message);
        return response;
    } catch (error) {
        return {
            success: false,
            error: String(error),
        };
    }
}
