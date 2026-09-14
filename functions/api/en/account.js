// POST /api/en/account —— 同步码的创建 / 登录 / 设置 PIN / 换码
//
// 英语站与萌码 Python **共用同一套身份**（accounts 表 + 同一个 8 位同步码），
// 所以这里直接复用 /api/account 的实现，不重复写一遍：
// 家长只需要记住一个码，两个站都能找回进度。
export { onRequestPost } from "../account.js";
