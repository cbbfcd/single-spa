import {
  NOT_MOUNTED,
  UNLOADING,
  NOT_LOADED,
  SKIP_BECAUSE_BROKEN,
  toName,
} from "../applications/app.helpers.js";
import { handleAppError } from "../applications/app-errors.js";
import { reasonableTime } from "../applications/timeouts.js";

const appsToUnload = {};

// 执行 unload 操作
export function toUnloadPromise(app) {
  return Promise.resolve().then(() => {
    const unloadInfo = appsToUnload[toName(app)];

    if (!unloadInfo) {
      /* No one has called unloadApplication for this app,
       */
      return app;
    }

    if (app.status === NOT_LOADED) {
      /* This app is already unloaded. We just need to clean up
       * anything that still thinks we need to unload the app.
       */
      finishUnloadingApp(app, unloadInfo);
      return app;
    }

    if (app.status === UNLOADING) {
      /* Both unloadApplication and reroute want to unload this app.
       * It only needs to be done once, though.
       */

      // 如果不执行 unloadInfo.resolve()。这里会一直 pending 的
      // e.g. new Promise(r => gg = r).then(() => console.log(123123)); 如果不执行 gg()，会一直 pending 的，想象一下这种技巧的使用场景和空间
      return unloadInfo.promise.then(() => app);
    }

    if (app.status !== NOT_MOUNTED) {
      /* The app cannot be unloaded until it is unmounted.
       */
      return app;
    }

    app.status = UNLOADING;
    // 执行 unload 生命周期
    return reasonableTime(app, "unload")
      .then(() => {
        finishUnloadingApp(app, unloadInfo);
        return app;
      })
      .catch((err) => {
        // 错误的话，状态置为 SKIP_BECAUSE_BROKEN
        errorUnloadingApp(app, unloadInfo, err);
        return app;
      });
  });
}

function finishUnloadingApp(app, unloadInfo) {
  delete appsToUnload[toName(app)];

  // Unloaded apps don't have lifecycles
  delete app.bootstrap;
  delete app.mount;
  delete app.unmount;
  delete app.unload;

  app.status = NOT_LOADED; // 状态又置回了初始的状态

  /* resolve the promise of whoever called unloadApplication.
   * This should be done after all other cleanup/bookkeeping
   */
  unloadInfo.resolve(); // 决议，后边不用等了
}

function errorUnloadingApp(app, unloadInfo, err) {
  delete appsToUnload[toName(app)];

  // Unloaded apps don't have lifecycles
  delete app.bootstrap;
  delete app.mount;
  delete app.unmount;
  delete app.unload;

  handleAppError(err, app, SKIP_BECAUSE_BROKEN);
  unloadInfo.reject(err);
}

// 函数名很清晰的说明了作用，将 app 添加到待 unload 的 cache 中
export function addAppToUnload(app, promiseGetter, resolve, reject) {
  appsToUnload[toName(app)] = { app, resolve, reject };

  // 覆写 getter，得到的是一个未决议的 promise
  Object.defineProperty(appsToUnload[toName(app)], "promise", {
    get: promiseGetter,
  });
}

export function getAppUnloadInfo(appName) {
  return appsToUnload[appName];
}
