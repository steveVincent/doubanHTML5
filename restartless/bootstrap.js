const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
Cu.import("resource://gre/modules/Services.jsm");

/**
* Apply a callback to each open and new browser windows.
*
* @usage watchWindows(callback): Apply a callback to each browser window.
* @param [function] callback: 1-parameter function that gets a browser window.
*/
function watchWindows(callback) {
  // Wrap the callback in a function that ignores failures
  function watcher(window) {
    try {
      // Now that the window has loaded, only handle browser windows
      let {documentElement} = window.document;
      if (documentElement.getAttribute("windowtype") == "navigator:browser")
        callback(window);
    }
    catch(ex) {}
  }

  // Wait for the window to finish loading before running the callback
  function runOnLoad(window) {
    // Listen for one load event before checking the window type
    window.addEventListener("load", function runOnce() {
      window.removeEventListener("load", runOnce, false);
      watcher(window);
    }, false);
  }

  // Add functionality to existing windows
  let windows = Services.wm.getEnumerator(null);
  while (windows.hasMoreElements()) {
    // Only run the watcher immediately if the window is completely loaded
    let window = windows.getNext();
    if (window.document.readyState == "complete")
      watcher(window);
    // Wait for the window to load before continuing
    else
      runOnLoad(window);
  }

  // Watch for new browser windows opening then wait for it to load
  function windowWatcher(subject, topic) {
    if (topic == "domwindowopened")
      runOnLoad(subject);
  }
  Services.ww.registerNotification(windowWatcher);

  // Make sure to stop watching for windows if we're unloading
  unload(function() Services.ww.unregisterNotification(windowWatcher));
}

/**
* Save callbacks to run when unloading. Optionally scope the callback to a
* container, e.g., window. Provide a way to run all the callbacks.
*
* @usage unload(): Run all callbacks and release them.
*
* @usage unload(callback): Add a callback to run on unload.
* @param [function] callback: 0-parameter function to call on unload.
* @return [function]: A 0-parameter function that undoes adding the callback.
*
* @usage unload(callback, container) Add a scoped callback to run on unload.
* @param [function] callback: 0-parameter function to call on unload.
* @param [node] container: Remove the callback when this container unloads.
* @return [function]: A 0-parameter function that undoes adding the callback.
*/
function unload(callback, container) {
  // Initialize the array of unloaders on the first usage
  let unloaders = unload.unloaders;
  if (unloaders == null)
    unloaders = unload.unloaders = [];

  // Calling with no arguments runs all the unloader callbacks
  if (callback == null) {
    unloaders.slice().forEach(function(unloader) unloader());
    unloaders.length = 0;
    return;
  }

  // The callback is bound to the lifetime of the container if we have one
  if (container != null) {
    // Remove the unloader when the container unloads
    container.addEventListener("unload", removeUnloader, false);

    // Wrap the callback to additionally remove the unload listener
    let origCallback = callback;
    callback = function() {
      container.removeEventListener("unload", removeUnloader, false);
      origCallback();
    }
  }

  // Wrap the callback in a function that ignores failures
  function unloader() {
    try {
      callback();
    }
    catch(ex) {}
  }
  unloaders.push(unloader);

  // Provide a way to remove the unloader
  function removeUnloader() {
    let index = unloaders.indexOf(unloader);
    if (index != -1)
      unloaders.splice(index, 1);
  }
  return removeUnloader;
}

/**
* Shift the window's main browser content down and right a bit
*/
function shiftBrowser(window) {
//  let style = window.gBrowser.style;
//
//  // Save the original margin values to restore them later
//  let origTop = style.marginTop;
//  let origLeft = style.marginLeft;

  // Push the main browser down and right
 // style.marginTop = style.marginLeft = "50px";
	
 // window.gBrowser.addTab("about:blank");

  // Restore the original position when the add-on is unloaded
  unload(function() {
    style.marginTop = origTop;
    style.marginLeft = origLeft;
  }, window);
}

/**
* Handle the add-on being activated on install/enable
*/
function startup(data, reason) {
  // Shift all open and new browser windows
  watchWindows(shiftBrowser);
}

/**
* Handle the add-on being deactivated on uninstall/disable
*/
function shutdown(data, reason) {
  // Clean up with unloaders when we're deactivating
  if (reason != APP_SHUTDOWN)
    unload();
}

/**
* Handle the add-on being installed
*/
function install(data, reason) {}

/**
* Handle the add-on being uninstalled
*/
function uninstall(data, reason) {}