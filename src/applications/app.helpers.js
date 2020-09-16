import { handleAppError } from "./app-errors.js";

// 注册了，但是未加载
export const NOT_LOADED = "NOT_LOADED";

// 正在加载 app 代码
export const LOADING_SOURCE_CODE = "LOADING_SOURCE_CODE";

// 已经加载还没启动，即未执行 app 的 bootstrap 生命周期函数
export const NOT_BOOTSTRAPPED = "NOT_BOOTSTRAPPED";

// 正在启动，执行 app 的 bootstrap 生命周期函数，只执行一次
export const BOOTSTRAPPING = "BOOTSTRAPPING";

// 已经启动，但是未挂载
export const NOT_MOUNTED = "NOT_MOUNTED";

// 正在挂载，执行 app 的 mount 函数
export const MOUNTING = "MOUNTING";

// 挂载了
export const MOUNTED = "MOUNTED";

// 更新中
export const UPDATING = "UPDATING";

// 移除挂载中，执行 app 的 unmount 函数
export const UNMOUNTING = "UNMOUNTING";

// 正在卸载，还没完成
export const UNLOADING = "UNLOADING";

// 加载错误
export const LOAD_ERROR = "LOAD_ERROR";

// 执行期间出错
export const SKIP_BECAUSE_BROKEN = "SKIP_BECAUSE_BROKEN";

export function isActive(app) {
  return app.status === MOUNTED;
}

export function shouldBeActive(app) {
  try {
    return app.activeWhen(window.location);
  } catch (err) {
    handleAppError(err, app, SKIP_BECAUSE_BROKEN);
    return false;
  }
}

export function toName(app) {
  return app.name;
}

export function isParcel(appOrParcel) {
  return Boolean(appOrParcel.unmountThisParcel);
}

export function objectType(appOrParcel) {
  return isParcel(appOrParcel) ? "parcel" : "application";
}
