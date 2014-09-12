(function($, window, document) {

  var fn = {

    startTicker: function(timeout, callback, target) {
      if ($.packshotViewer.debug) console.log("startTicker() --> ", "this:", this, " / arguments", arguments);
      var timeout = timeout == undefined ? 250 : timeout;
      target.data("packshotViewer").ticker.currentStep++;

      window.setTimeout(function() {
        target.data("packshotViewer").ticker.delayedStep++;
        if (target.data("packshotViewer").ticker.currentStep == target.data("packshotViewer").ticker.delayedStep) {
          callback(target);
        }
      }, timeout);
    },

    handleEvents: function(eventsToProcess, action, target) {
      if ($.packshotViewer.debug) console.log("handleEvents() --> ", "this:", this, " / arguments", arguments);
      var
        i = 0,
        boundEvents = $._data(target.data("area").get(0)).events;

      if (action == "backup") {
        eventsToProcess.forEach(function() {
          var backupName = "_" + [eventsToProcess[i]]; // Backup name should be the original event name preceded with an underscore

          boundEvents[backupName] = boundEvents[eventsToProcess[i]]; // Backup event...
          boundEvents[eventsToProcess[i]] = null; // ...and empty its original name
          i++;
        });
      } else if (action == "restore") {
        eventsToProcess.forEach(function() {
          boundEvents[eventsToProcess[i]] = boundEvents["_" + [eventsToProcess[i]]];
          i++;
        });
      }

    },

    prepareZoom: function(e, target) {
      if ($.packshotViewer.debug) console.log("prepareZoom() --> ", "this:", this, " / arguments", arguments);

      var
        sequence = $.packshotViewer.data.instances[target.data("packshotViewer").insIndex].galleries[target.data("packshotViewer").galIndex].sequences[target.data("packshotViewer").seqIndex],
        steps    = sequence.zoomSteps == undefined ? 100 : sequence.zoomSteps;

      sequence.handler.reel.cacheHighResImage(undefined, function(target) {
        sequence.container.handler.css("overflow","hidden");
        sequence.container.handler.data("areaWidth", sequence.handler.data("area").width());
        sequence.container.handler.data("areaHeight", sequence.handler.data("area").height());
        sequence.container.handler.data("zoomDistanceWidth", (sequence.highResWidth - sequence.width) / steps);
        sequence.container.handler.data("zoomDistanceHeight", (sequence.highResHeight - sequence.height) / steps);
        sequence.container.handler.data("ui", 0);
        $("#packshotViewerInstance" + target.data("packshotViewer").insIndex + " .slider").slider("value", 0);
      }, sequence.handler);
    },

    cacheHighResImage: function(frame, callback, target) {
      if ($.packshotViewer.debug) console.log("cacheHighResImage() --> ", "this:", this, " / arguments", arguments);

      var
        sequence = $.packshotViewer.data.instances[target.data("packshotViewer").insIndex].galleries[target.data("packshotViewer").galIndex].sequences[target.data("packshotViewer").seqIndex],
        image    = sequence.images[frame == undefined ? 0 : frame - 1],
        source   = sequence.path + "/" + sequence.platform + "/" + sequence.quality + "/highres/" + image,

        cb = function() {

          if (sequence.handler.data("packshotViewer").cache.indexOf(source) === -1) {
            $("<img>", {"class": "highres-cached", src: source, width: sequence.highResWidth, height: sequence.highResHeight}).appendTo(sequence.handler.data("area"));
            sequence.handler.data("packshotViewer").cache.push(source);
          }

          if (callback != undefined) {
            var wrapped = callback.apply(cb, [sequence.handler]);
            return wrapped;
          }
        };

      cb();
    },

    extendedZoom: function(e, delta, ev) {
      if ($.packshotViewer.debug) console.log("extendedZoom() --> ", "this:", this, " / arguments", arguments);

      if (e.type == "pinch" && !e.isDefaultPrevented()) {
        e.gesture.preventDefault();
        e.gesture.stopPropagation()
        console.log(e.gesture.deltaX, e.gesture.deltaY, e);
      }

      if (!delta) return;

      var
        target    = e.data.target,
        slider    = e.data.slider,
        sequence  = $.packshotViewer.data.instances[target.data("packshotViewer").insIndex].galleries[target.data("packshotViewer").galIndex].sequences[target.data("packshotViewer").seqIndex],
        zoomSteps = sequence.zoomSteps,
        factor    = 0.01 * e.data.step,
        step      = zoomSteps * factor,
        value     = slider.slider("value");

      if (e.type == "pinch") {
        //value += e.gesture.scale;
      } else {
        value += delta * step;
      }

      value = value > sequence.zoomSteps ? sequence.zoomSteps : value < 0 ? 0 : value;

      var result = slider
        .slider("option", "slide")
        .call(slider, e, {value: value});

      if (result !== false) {
          slider.slider("value", value);
      }
    },

    unloadHighResImage: function(e, target) {
      if ($.packshotViewer.debug) console.log("unloadHighResImage() --> ", "this:", this, " / arguments", arguments);

      var sequence = $.packshotViewer.data.instances[target.data("packshotViewer").insIndex].galleries[target.data("packshotViewer").galIndex].sequences[target.data("packshotViewer").seqIndex];

      if (sequence.handler.data("packshotViewer").highResImageLoaded) {
        sequence.handler.data("packshotViewer").highResImageLoaded = false;
        var
          frame  = sequence.mode == "turntable" ? target.reel("frame") : 1,
          image  = sequence.images[frame - 1],
          source = sequence.path + "/" + sequence.platform + "/" + sequence.quality + "/lowres/" + image;
        sequence.handler.attr({src: source});
      }
    },

    zoom: function(e, target) {
      if ($.packshotViewer.debug) console.log("zoom() --> ", "this:", this, " / arguments", arguments);
      var
        sequence        = $.packshotViewer.data.instances[target.data("packshotViewer").insIndex].galleries[target.data("packshotViewer").galIndex].sequences[target.data("packshotViewer").seqIndex],
        zoomWidth       = sequence.container.handler.data("zoomDistanceWidth") * sequence.container.handler.data("ui"),
        zoomHeight      = sequence.container.handler.data("zoomDistanceHeight") * sequence.container.handler.data("ui"),
        notEnoughWidth  = sequence.width + zoomWidth > sequence.container.handler.data("areaWidth"),
        notEnoughHeight = sequence.height + zoomHeight > sequence.container.handler.data("areaHeight"),
        areaWidth       = notEnoughWidth ? sequence.width + zoomWidth : sequence.container.handler.data("areaWidth"),
        areaHeight      = notEnoughHeight ? sequence.height + zoomHeight : sequence.container.handler.data("areaHeight"),
        areaMarginTop   = notEnoughHeight ? -(Math.round((areaHeight - sequence.container.handler.height()) / 2)) : 0,
        areaMarginLeft  = notEnoughWidth ? -(Math.round((areaWidth - sequence.container.handler.width()) / 2)) : 0;

      sequence.handler.data("area").width(areaWidth);
      sequence.handler.data("area").height(areaHeight);
      sequence.handler.width(sequence.width + zoomWidth);
      sequence.handler.height(sequence.height + zoomHeight);
      sequence.handler.data("area").css("marginTop", areaMarginTop + "px");
      sequence.handler.data("area").css("marginLeft", areaMarginLeft + "px");
      sequence.handler.css("marginTop", Math.round((sequence.handler.data("area").height() - sequence.handler.height()) / 2));
      sequence.handler.css("marginLeft", Math.round((sequence.handler.data("area").width() - sequence.handler.width()) / 2));
    },

    loadHighResImage: function(e, target) {
      if ($.packshotViewer.debug) console.log("loadHighResImage() --> ", "this:", this, " / arguments", arguments);

      var sequence = $.packshotViewer.data.instances[target.data("packshotViewer").insIndex].galleries[target.data("packshotViewer").galIndex].sequences[target.data("packshotViewer").seqIndex];

      if (!target.data("packshotViewer").highResImageLoaded) {

        if (target.data("packshotViewer").ticker.delayedStep == target.data("packshotViewer").ticker.currentStep) {
          target.data("packshotViewer").ticker.delayedStep = 0;
          target.data("packshotViewer").ticker.currentStep = 0;
          target.data("packshotViewer").highResImageLoaded = true;
          var
            frame  = sequence.mode == "turntable" ? target.reel("frame") : 1,
            image  = sequence.images[frame - 1],
            source = sequence.path + "/" + sequence.platform + "/" + sequence.quality + "/highres/" + image;
          target.reel.cacheHighResImage(frame, function() {
            target.attr({src: source});
          }, target);
        }
      }
    }
  };

  $.extend($.fn.reel, fn);

})(jQuery, window, document);
