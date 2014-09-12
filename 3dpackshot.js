(function ($, window, document, undefined) {

/*=====================================
=            Reel defaults            =
=====================================*/

  $.reel.def.cw         = true;
  $.reel.def.opening    = 1;
  $.reel.def.preloader  = 0;
  $.reel.def.entry      = -1;
  $.reel.def.revolution = 500;
  $.reel.def.wheelable  = false;

/*-----  End of Reel defaults  ------*/

/*===========================================================
=            ColorBox resize when window resizes            =
===========================================================*/

  $(window).resize(function() {

    $(".reelContainer").each(function() {

      if ($(this).data("fullscreen")) {
        $.colorbox.resize({
          width: $(window).width(),
          height: $(window).height()
        });
      }
    });
  });

/*-----  End of ColorBox resize when window resizes  ------*/

  var
    packshotViewer   = "packshotViewer",
    defaults      = {
      zoomSteps: 100,
      format:    "jpg"
    },

    /**
    *
    * PRIVATE METHODS
    *
    **/
    _init = function(element) {
      if ($.packshotViewer.debug) console.log("_init() --> ", "this:", this, " / arguments", arguments);
    },

    _getGalIndex = function(insIndex, gallery_id) {
      if ($.packshotViewer.debug) console.log("_getGalIndex() --> ", "this:", this, " / arguments", arguments);
      var galIndex;

      for (gallery in $.packshotViewer.data.instances[insIndex].galleries) {
        galIndex = gallery_id == $.packshotViewer.data.instances[insIndex].galleries[gallery]["id"] ? gallery : -1;

        if (galIndex != -1) {
          break;
        }
      }

      return galIndex;

    },

    _prepareInstance = function(initial, insIndex) {
      if ($.packshotViewer.debug) console.log("_prepareInstance() --> ", "this:", this, " / arguments", arguments);

      if (initial) {

        $.packshotViewer.data.instances.forEach(function(instance, insIndex) {
          $(instance.pin.self).append($("<div>", {class: "packshotViewerInstance", id: "packshotViewerInstance"+insIndex}));
          $(".packshotViewerInstance").append($('<div>', {class: "packshotViewerContainer"}));
          $(".packshotViewerContainer")
            .append($('<div>', {class: "reelContainer"}))
            .append($('<div>', {class: "controlsContainer"}));
          $(".reelContainer").append($('<img>', {class: "reelPlaceholder"}));
          $(instance.pin.thumbs).append($("<div>", {class: "sequenceThumbnailsContainer"}));
        });

      } else {
        var instance = $.packshotViewer.data.instances[insIndex];
        $(instance.pin.self).empty();
        $(instance.pin.thumbs).empty();
        $(instance.pin.self).append($("<div>", {class: "packshotViewerInstance", id: "packshotViewerInstance"+insIndex}));
        $(".packshotViewerInstance").append($('<div>', {class: "packshotViewerContainer"}));
        $(".packshotViewerContainer")
          .append($('<div>', {class: "reelContainer"}))
          .append($('<div>', {class: "controlsContainer"}));
        $(".reelContainer").append($('<img>', {class: "reelPlaceholder"}));
        $(instance.pin.thumbs).append($("<div>", {class: "sequenceThumbnailsContainer"}));
      }
    },

    _prepareSequences = function(insIndex, galIndex) {
      if ($.packshotViewer.debug) console.log("_prepareSequences() --> ", "this:", this, " / arguments", arguments);

        $.packshotViewer.data.instances[insIndex].galleries[galIndex].sequences.forEach(function(sequence, seqIndex) {
          $(".sequenceThumbnailsContainer").append($("<img>", {class: "sequenceThumbnail", id: "sequenceThumbnail"+seqIndex}));
          $("#sequenceThumbnail"+seqIndex)
            .attr("src", sequence.path+"/"+sequence.platform+"/"+sequence.quality+"/thumbnail.jpg")
            .width(sequence.thumbnailWidth)
            .height(sequence.thumbnailHeight);
        });

    },

    _resizeContainers = function() {
      $(".controlsContainer").height($(".controlsContainer button").outerHeight(true));
      $(".packshotViewerContainer").width($(".reelContainer").outerWidth(true));
      $(".packshotViewerContainer").height($(".reelContainer").outerHeight(true) + $(".controlsContainer").outerHeight(true));
      $(".packshotViewerInstance").find(".sequenceThumbnailsContainer").get(0) ? $(".packshotViewerInstance").width($(".packshotViewerContainer").outerWidth(true) + ($(".sequenceThumbnailsContainer").outerWidth(true))) : $(".packshotViewerInstance").width($(".packshotViewerContainer").outerWidth(true));
      $(".packshotViewerInstance").height($(".packshotViewerContainer").outerHeight(true));
      $(".controlsContainer").css("marginLeft", Math.round(($(".packshotViewerContainer").width() - $(".sliderContainer").outerWidth(true)) / 2) + "px");
      $(".controlsContainer").css("marginRight", $(".controlsContainer button:visible").css("marginLeft"));
    },

    _initViewer = function(insIndex, galIndex) {
      if ($.packshotViewer.debug) console.log("_initViewer() --> ", "this:", this, " / arguments", arguments);

        $.packshotViewer.data.instances[insIndex].galleries[galIndex].sequences.forEach(function(sequence, seqIndex) {
          _addSequence(
            $("#packshotViewerInstance"+insIndex+" .reelContainer"),
            $("#packshotViewerInstance"+insIndex+" .reelPlaceholder"),
            {
              insIndex:      insIndex,
              galIndex:      galIndex,
              seqIndex:      seqIndex,
              path:          sequence.path,
              frames:        sequence.frames,
              mode:          sequence.mode,
              lowResWidth:   sequence.lowResWidth,
              lowResHeight:  sequence.lowResHeight,
              highResWidth:  sequence.highResWidth,
              highResHeight: sequence.highResHeight
            }
          );
        });

        _addReel(insIndex, galIndex);
    },

    _addSequence = function(containerHandler, sequenceHandler, attributes) {
      if ($.packshotViewer.debug) console.log("_addSequence() --> ", "this:", this, " / arguments", arguments);
      $.extend(attributes, defaults);

      var
        containerWidth  = containerHandler.width(),
        containerHeight = containerHandler.height(),
        insIndex        = attributes.insIndex === undefined ? 1 : attributes.insIndex;

      attributes.insIndex            = insIndex;
      attributes.handler             = sequenceHandler;
      attributes.placeholder         = new Image;
      attributes.width               = attributes.lowResWidth;
      attributes.height              = attributes.lowResHeight;
      attributes.orientation         = _getOrientation(attributes.width, attributes.height);
      attributes.images              = _getImages(attributes);
      attributes.container           = {
        handler:     containerHandler,
        width:       containerWidth,
        height:      containerHeight,
        orientation: _getOrientation(containerWidth, containerHeight)
      };

      _setDimensions(attributes);
      $.extend($.packshotViewer.data.instances[attributes.insIndex].galleries[attributes.galIndex].sequences[attributes.seqIndex], attributes);
    },

    _getOrientation = function(width, height) {
      if ($.packshotViewer.debug) console.log("_getOrientation() --> ", "this:", this, " / arguments", arguments);
      return width == height ? "square" : width > height ? "landscape" : "portrait";
    },

    _getImages = function(seqIndex) {
      if ($.packshotViewer.debug) console.log("_getImages() --> ", "this:", this, " / arguments", arguments);
      var stack = [];

      for (var i = 1; i <= seqIndex.frames; i++) {
        var fileName = i + "." + seqIndex.format;

        while (fileName.length < 7) {
          fileName = "0" + fileName;
        }

        stack.push(fileName);
      }

      return stack;
    },

    _setDimensions = function(attributes) {
      if ($.packshotViewer.debug) console.log("_setDimensions() --> ", "this:", this, " / arguments", arguments);
      var
        factor = 1,
        width  = attributes.width,
        height = attributes.height;

      if (attributes.container.orientation == "square" && attributes.orientation == "square") {
        width = height = attributes.container.width;
      } else {
        factor = attributes.orientation == "landscape" ? attributes.container.width / width : attributes.container.height / height;
        factor = attributes.orientation == "landscape" && factor * height > attributes.container.height ? attributes.container.height / height : factor;
        factor = attributes.orientation == "portrait" && factor * width > attributes.container.width ? attributes.container.width / width : factor;
      }

      attributes.width = Math.round(width * factor);
      attributes.height = Math.round(height * factor);
    },

    _addReel = function(insIndex, galIndex) {
      if ($.packshotViewer.debug) console.log("_addReel() --> ", "this:", this, " / arguments", arguments);

      $.packshotViewer.data.instances[insIndex].galleries[galIndex].sequences.forEach(function(sequence, seqIndex) {

        /* Check if thumbnail exists */
        if ($("#sequenceThumbnail" + seqIndex).length) {
          _addClickEvent(insIndex, galIndex, seqIndex); // The reel should load when the thumbnail is clicked.
        } else {
          _initReel(insIndex, galIndex, seqIndex); // If no thumbnail exists, the reel should load.
        }

      });
    },

    _addClickEvent = function(insIndex, galIndex, seqIndex) {
      if ($.packshotViewer.debug) console.log("_addClickEvent() --> ", "this:", this, " / arguments", arguments);

      $("#sequenceThumbnail" + seqIndex).click({insIndex: insIndex, galIndex: galIndex, seqIndex: seqIndex}, function(e) {
        if ($.packshotViewer.debug) console.log("click() --> ", "this:", this, " / arguments", arguments);

        var sequence = $.packshotViewer.data.instances[e.data.insIndex].galleries[e.data.galIndex].sequences[e.data.seqIndex];

        if (sequence.handler.data("area")) {
          var
            source = sequence.path + "/" + sequence.platform + "/" + sequence.quality + "/lowres/001." + sequence.format,
            onload = function() {
              $(sequence.handler).data("packshotViewer").loaded = true;
              _unloadReel(sequence.handler.data("packshotViewer").insIndex, sequence.handler.data("packshotViewer").galIndex, sequence.handler.data("packshotViewer").seqIndex);
              _loadReel(e.data.insIndex, e.data.galIndex, e.data.seqIndex);
            };

          if ($(sequence.handler).data("packshotViewer").loaded) {
            sequence.placeholder = new Image();
          }

          sequence.placeholder.onload = onload;
          sequence.placeholder.src = source;

        } else {
          _initReel(e.data.insIndex, e.data.galIndex, e.data.seqIndex);
        }
      });

      if ($.packshotViewer.data.instances[insIndex].galleries[galIndex].default == seqIndex) {
        $("#sequenceThumbnail" + seqIndex).click();
      }
    },

    _initReel = function(insIndex, galIndex, seqIndex) {
      if ($.packshotViewer.debug) console.log("_initReel() --> ", "this:", this, " / arguments", arguments);

      var sequence = $.packshotViewer.data.instances[insIndex].galleries[galIndex].sequences[seqIndex];

      sequence.handler.data("packshotViewer", {
        cache:              [],
        highResImageLoaded: false,
        loaded:             false,
        insIndex:           0,
        galIndex:           0,
        seqIndex:           0,
        ticker:             {
          currentStep: 0,
          delayedStep: 0
        }
      });

      sequence.placeholder.src = sequence.path + "/" + sequence.platform + "/" + sequence.quality + "/lowres/001." + sequence.format;
      sequence.placeholder.onload = function() {
        sequence.handler.data("packshotViewer").loaded = true;
        _loadReel(insIndex, galIndex, seqIndex);
      }
    },

    _loadReel = function(insIndex, galIndex, seqIndex) {
    if ($.packshotViewer.debug) console.log("_loadReel() --> ", "this:", this, " / arguments", arguments);

    var sequence = $.packshotViewer.data.instances[insIndex].galleries[galIndex].sequences[seqIndex];
    var elementId = "#packshotViewerInstance" + insIndex + " ";

    sequence.handler.data("packshotViewer").insIndex = insIndex;
    sequence.handler.data("packshotViewer").galIndex = galIndex;
    sequence.handler.data("packshotViewer").seqIndex = seqIndex;
    sequence.handler
      .attr("src", sequence.placeholder.src)
      .on("loadHighResImage", sequence.handler.reel.loadHighResImage)
      .on("unloadHighResImage", sequence.handler.reel.unloadHighResImage)
      .on("prepareZoom", sequence.handler.reel.prepareZoom)
      .on("zoom", sequence.handler.reel.zoom);

    if (sequence.mode == "turntable") {
      _generateControls(insIndex, galIndex, seqIndex);
      sequence.handler
        .reel({
          path: sequence.path + "/" + sequence.platform + "/" + sequence.quality + "/lowres/",
          images: sequence.images,
          attr: {
            width:  sequence.container.width,
            height: sequence.container.height
          }
        })
        .on("loaded", sequence.handler, function(e) {
          e.data.trigger("prepareZoom", [e.data]);
        })
        .on("frameChange", function(e, undefined, frame) {

          if (sequence.handler.reel("reeled")) {
            sequence.handler.data("packshotViewer").highResImageLoaded = false;

            sequence.handler.reel.startTicker(150, function(target) {
              target.trigger("loadHighResImage", [target]);
            }, sequence.handler);
          }
        })
        .on("openingDone", sequence.handler, function(e) {
          e.data.trigger("loadHighResImage", [e.data]);
        });
      sequence.handler
        .width(sequence.width)
        .height(sequence.height)
        .css("marginTop", Math.round((sequence.container.height - sequence.height) / 2))
        .css("marginLeft", Math.round((sequence.container.width - sequence.width) / 2));
      sequence.handler.data("area").on("mousewheel", {target: sequence.handler, slider: $(elementId + ".slider"), step: 5}, sequence.handler.reel.extendedZoom);

    } else if (sequence.mode == "static") {
      _generateControls(insIndex, galIndex, seqIndex);
      sequence.handler
        .width(sequence.width)
        .height(sequence.height)
        .css("marginTop", Math.round((sequence.container.height - sequence.height) / 2))
        .css("marginLeft", Math.round((sequence.container.width - sequence.width) / 2))
        .wrap($("<div>", {"class": "reel-overlay"}))
        .addClass("reel")
        .data("area", sequence.handler.parent())
        .trigger("prepareZoom", [sequence.handler]);
      sequence.handler.data("area").on("mousewheel", {target: sequence.handler, slider: $(elementId + ".slider"), step: 5}, sequence.handler.reel.extendedZoom);
      $(elementId + ".move").click();
    }

    sequence.handler.data("area")
      .width(sequence.container.width)
      .height(sequence.container.height);
    sequence.container.handler
      .data("areaWidth", sequence.container.width)
      .data("areaHeight", sequence.container.height);

    sequence.handler.data("area").mousewheel(function(e) {
      e.preventDefault();
    });

    if (Modernizr.touch) sequence.handler.data("area").hammer();
  },

  _unloadReel = function(insIndex, galIndex, seqIndex) {
    var sequence = $.packshotViewer.data.instances[insIndex].galleries[galIndex].sequences[seqIndex];
    var elementId = "#packshotViewerInstance" + insIndex + " ";

    if ($.packshotViewer.debug) console.log("_unloadReel() --> ", "this:", this, " / arguments", arguments);

    $(elementId + ".center").trigger("click", [false]);

    if ($(elementId + ".move").hasClass("active")) {
      sequence.handler
        .draggable("destroy")
        .data("area").css({cursor: ""});
    }

    if (sequence.mode == "turntable") {
      sequence.handler
        .unreel()
        .off("loaded")
        .off("frameChange")
        .off("openingDone");

    } else if (sequence.mode == "static") {
      sequence.handler.data("area").off("mousewheel");
      sequence.handler
        .removeData("area")
        .removeData("areaWidth")
        .removeData("areaHeight")
        .unwrap()
        .removeClass("reel");
    }

    $(elementId + ".controlsContainer").empty();

    sequence.handler
      .off("loadHighResImage")
      .off("unloadHighResImage")
      .off("prepareZoom")
      .off("zoom")
      .data("packshotViewer").cache.length = 0;
  },

  _generateControls = function(insIndex, galIndex, seqIndex) {
    if ($.packshotViewer.debug) console.log("_generateControls() --> ", "this:", this, " / arguments", arguments);

    var elementId = "#packshotViewerInstance" + insIndex + " ";
    var sequence = $.packshotViewer.data.instances[insIndex].galleries[galIndex].sequences[seqIndex];

    $(elementId + ".controlsContainer")
      .append($("<div>", {"class": "sliderContainer"}))
      .append($("<button>", {title: "", "class": "fsout", style: "display: none;"}).click(function(e) {
        elementId = sequence.container.handler.data("fullscreen") ? "#colorbox " : elementId;
        if (!Modernizr.touch && !!$.packshotViewer.tooltip) {
          if ($.packshotViewer.tooltip == "jQueryUI") {
            $(elementId + ".controlsContainer .fsout").tooltip("close");
          } else if ($.packshotViewer.tooltip == "Bootstrap"){
            $(elementId + ".controlsContainer .fsout").tooltip("hide");
          }
        }
        $.colorbox.close();
      }))
      .append($("<button>", {title: "", "class": "inline"}).data("insIndex", insIndex).click(function(e) {
        elementId = sequence.container.handler.data("fullscreen") ? "#colorbox " : elementId;
        if (!Modernizr.touch && !!$.packshotViewer.tooltip) {
          if ($.packshotViewer.tooltip == "jQueryUI") {
            $(elementId + ".controlsContainer .inline").tooltip("close");
          } else if ($.packshotViewer.tooltip == "Bootstrap"){
            $(elementId + ".controlsContainer .inline").tooltip("hide");
          }
        }
      }))
      .append($("<button>", {title: "", "class": "rotate active", style: sequence.mode == "turntable" ? "display: default;" : "display: none;"}).click(function(e) {
        elementId = sequence.container.handler.data("fullscreen") ? "#colorbox " : elementId;
        _activateRotate(insIndex, galIndex, seqIndex, elementId);
      }))
      .append($("<button>", {title: "", "class": "move inactive", style: sequence.mode == "turntable" ? "display: default;" : "display: none;"}).click(function(e) {
        elementId = sequence.container.handler.data("fullscreen") ? "#colorbox " : elementId;
        _activateMove(insIndex, galIndex, seqIndex, elementId);
      }))
      .append($("<button>", {title: "", "class": "center"}).click(function(e, animate) {
        animate = animate === undefined ? true : false;
        elementId = sequence.container.handler.data("fullscreen") ? "#colorbox " : elementId;
        if (animate) sequence.handler.animate({"left": 0, "top": 0}, "slow");
        if (!animate) sequence.handler.css({left: 0, top: 0});
      }));

    if (!Modernizr.touch && !!$.packshotViewer.tooltip) {
      if ($.packshotViewer.tooltip == "jQueryUI") {
        $(elementId + ".controlsContainer .fsout").tooltip({content: "Original size", position: {my: "right+5px bottom-10px", at: "center top", of: $(elementId + ".controlsContainer .fsout")}});
        $(elementId + ".controlsContainer .inline").tooltip({content: "Full screen", position: {my: "right+5px bottom-10px", at: "center top", of: $(elementId + ".controlsContainer .inline")}});
        $(elementId + ".controlsContainer .rotate").tooltip({content: "Rotate", position: {my: "right+5px bottom-10px", at: "center top", of: $(elementId + ".controlsContainer .rotate")}});
        $(elementId + ".controlsContainer .move").tooltip({content: "Move", position: {my: "right+5px bottom-10px", at: "center top", of: $(elementId + ".controlsContainer .move")}});
        $(elementId + ".controlsContainer .center").tooltip({content: "Recenter", position: {my: "right+5px bottom-10px", at: "center top", of: $(elementId + ".controlsContainer .center")}});
      } else if ($.packshotViewer.tooltip == "Bootstrap"){
        $(elementId + ".controlsContainer .fsout").tooltip({title: "Original size"});
        $(elementId + ".controlsContainer .inline").tooltip({title: "Full screen"});
        $(elementId + ".controlsContainer .rotate").tooltip({title: "Rotate"});
        $(elementId + ".controlsContainer .move").tooltip({title: "Move"});
        $(elementId + ".controlsContainer .center").tooltip({title: "Recenter"});
      }
    }

    $(elementId + ".sliderContainer").append($("<div>", {"class": "slider"}).data("insIndex", insIndex));
    $(elementId + ".slider").slider({
      max:   sequence.zoomSteps,
      slide: function(e, ui) {
        if ($.packshotViewer.debug) console.log("slide() --> ", "this:", this, " / arguments", arguments);

        elementId = sequence.container.handler.data("fullscreen") ? "#colorbox " : elementId;
        sequence.handler.trigger("unloadHighResImage", [sequence.handler]);
        sequence.container.handler.data("ui", ui.value);
        sequence.handler.trigger("zoom", [sequence.handler]);

        if (!sequence.handler.reel("opening")) {
          sequence.handler.reel.startTicker(50, function(target) {
            sequence.handler.trigger("loadHighResImage", [sequence.handler]);
          }, sequence.handler);
        }

      }
    });

    _resizeContainers();

    $(elementId + ".inline").colorbox({
      inline:      true,
      href:        elementId + ".packshotViewerContainer",
      width:       "100%",
      height:      "100%",
      transition:  "none",
      closeButton: false,
      scrolling:   false,
      reposition:  false,
      top:         "0px",
      left:        "0px",

      onLoad: function() {
        $(":root").css({height: "100%"});
        $.packshotViewer.data.scrollTop = $(window).scrollTop();
        $.packshotViewer.data.scrollLeft = $(window).scrollLeft();
        $(window).scrollTop(0);
        $(window).scrollLeft(0);

        sequence.container.handler.data("fullscreen", true);

        $(elementId + ".inline").css("display", "none");
        $(elementId + ".fsout").css("display", "block");
        $(elementId + ".packshotViewerContainer")
          .data("_width", $(elementId + ".packshotViewerContainer").width())
          .data("_height", $(elementId + ".packshotViewerContainer").height())
          .data("dirtWidth", $(elementId + ".packshotViewerContainer").outerWidth(true) - $(elementId + ".packshotViewerContainer").innerWidth())
          .data("dirtHeight", $(elementId + ".packshotViewerContainer").outerHeight(true) - $(elementId + ".packshotViewerContainer").innerHeight());
        $(elementId + ".reelContainer")
          .data("_width", $(elementId + ".reelContainer").width())
          .data("_height", $(elementId + ".reelContainer").height())
          .data("dirtWidth", $(elementId + ".reelContainer").outerWidth(true) - $(elementId + ".reelContainer").innerWidth())
          .data("dirtHeight", $(elementId + ".reelContainer").outerHeight(true) - $(elementId + ".reelContainer").innerHeight());
        sequence.container.handler
          .data("_areaWidth", sequence.container.handler.data("areaWidth"))
          .data("_areaHeight", sequence.container.handler.data("areaHeight"))
          .data("_width", sequence.container.handler.width())
          .data("_height", sequence.container.handler.height())
          .data("dirtWidth", sequence.container.handler.outerWidth(true) - sequence.container.handler.innerWidth())
          .data("dirtHeight", sequence.container.handler.outerHeight(true) - sequence.container.handler.innerHeight());
        $(elementId + ".packshotViewerContainer")
          .data("_paddingTop", $(elementId + ".packshotViewerContainer").css("paddingTop"))
          .data("_paddingRight", $(elementId + ".packshotViewerContainer").css("paddingRight"))
          .data("_paddingBottom", $(elementId + ".packshotViewerContainer").css("paddingBottom"))
          .data("_paddingLeft", $(elementId + ".packshotViewerContainer").css("paddingLeft"))
          .data("_marginTop", $(elementId + ".packshotViewerContainer").css("marginTop"))
          .data("_marginRight", $(elementId + ".packshotViewerContainer").css("marginRight"))
          .data("_marginBottom", $(elementId + ".packshotViewerContainer").css("marginBottom"))
          .data("_marginLeft", $(elementId + ".packshotViewerContainer").css("marginLleft"))
          .css("paddingTop", "0px")
          .css("paddingRight", "0px")
          .css("paddingBottom", "0px")
          .css("paddingLeft", "0px")
          .css("marginTop", "0px")
          .css("marginRight", "0px")
          .css("marginBottom", "0px")
          .css("marginLeft", "0px");
      },

      onComplete: function() {
        $.packshotViewer.data.colorbox = $("#colorbox").detach();
        $("body").wrapInner($("<div>", {id: "packshotWrapper"}));
        $.packshotViewer.data.original = $("#packshotWrapper").detach();
        $("body").append($.packshotViewer.data.colorbox);
        $.colorbox.resize({
          width: $(window).width(),
          height: $(window).height()
        });
      },

      onCleanup: function() {
      },

      onClosed: function() {
        $.packshotViewer.data.colorbox = $("#colorbox").detach();
        $("body").append($.packshotViewer.data.original);
        $("#packshotWrapper").children().unwrap();
        $("body").append($.packshotViewer.data.colorbox);

        $(window).scrollTop($.packshotViewer.data.scrollTop);
        $(window).scrollLeft($.packshotViewer.data.scrollLeft);

        sequence.container.handler.data("fullscreen", false);

        elementId = "#packshotViewerInstance" + insIndex + " ";
        $(elementId + ".inline").css("display", "block");
        $(elementId + ".fsout").css("display", "none");
        $(elementId + ".slider").slider("value", 0);
        sequence.container.handler
          .data("ui", 0)
          .data("areaWidth", sequence.container.handler.data("_areaWidth"))
          .data("areaHeight", sequence.container.handler.data("_areaHeight"));
        $(elementId + ".packshotViewerContainer")
          .width($(elementId + ".packshotViewerContainer").data("_width"))
          .height($(elementId + ".packshotViewerContainer").data("_height"));
        sequence.container.handler
          .width(sequence.container.handler.data("_width"))
          .height(sequence.container.handler.data("_height"));
        $(elementId + ".packshotViewerContainer")
          .css("paddingTop", $(elementId + ".packshotViewerContainer").data("_paddingTop"))
          .css("paddingRight", $(elementId + ".packshotViewerContainer").data("_paddingRight"))
          .css("paddingBottom", $(elementId + ".packshotViewerContainer").data("_paddingBottom"))
          .css("paddingLeft", $(elementId + ".packshotViewerContainer").data("_paddingLeft"))
          .css("marginTop", $(elementId + ".packshotViewerContainer").data("_marginTop"))
          .css("marginRight", $(elementId + ".packshotViewerContainer").data("_marginRight"))
          .css("marginBottom", $(elementId + ".packshotViewerContainer").data("_marginBottom"))
          .css("marginLeft", $(elementId + ".packshotViewerContainer").data("_marginLeft"));
        $(elementId + ".controlsContainer").css("marginLeft", Math.round(($(elementId + ".packshotViewerContainer").width() - $(elementId + ".sliderContainer").outerWidth(true)) / 2) + "px");

        $(elementId + ".center").trigger("click", [false]);

        $(elementId + ".packshotViewerContainer")
          .removeData("_width")
          .removeData("_height")
          .removeData("dirtWidth")
          .removeData("dirtHeight");
        $(elementId + ".reelContainer")
          .removeData("_width")
          .removeData("_height")
          .removeData("dirtWidth")
          .removeData("dirtHeight");
        sequence.container.handler
          .removeData("_areaWidth")
          .removeData("_areaHeight")
          .removeData("_width")
          .removeData("_height")
          .removeData("dirtWidth")
          .removeData("dirtHeight");
        $(elementId + ".packshotViewerContainer")
          .removeData("_paddingTop")
          .removeData("_paddingRight")
          .removeData("_paddingBottom")
          .removeData("_paddingLeft")
          .removeData("_marginTop")
          .removeData("_marginRight")
          .removeData("_marginBottom")
          .removeData("_marginLeft");

        sequence.handler.trigger("zoom", [sequence.handler]);
      }
    });
  },

  _activateMove = function(insIndex, galIndex, seqIndex, elementId) {
    if ($.packshotViewer.debug) console.log("_activateMove() --> ", "this:", this, " / arguments", arguments);
    var sequence = $.packshotViewer.data.instances[insIndex].galleries[galIndex].sequences[seqIndex];

    if ($(elementId + ".move").hasClass("inactive")) {
      $(elementId + ".move")
        .removeClass("inactive")
        .addClass("active");
      if ($(elementId + ".rotate").hasClass("active")) _deactivateRotate(insIndex, galIndex, seqIndex, elementId);

      sequence.handler.draggable();
      sequence.container.handler.data("reelAreaCursorBackup", sequence.handler.data("area").css("cursor"));
      sequence.container.handler.data("reelCursorBackup", sequence.handler.css("cursor"));
      sequence.handler.data("area").css({cursor: "default"});
      sequence.handler.css({cursor: "pointer"});
      if (sequence.mode == "turntable") sequence.handler.reel.handleEvents(["mousedown", Modernizr.touch ? "touchstart" : "dragstart"], "backup", sequence.handler);
    }

  },

  _deactivateMove = function(insIndex, galIndex, seqIndex, elementId) {
    if ($.packshotViewer.debug) console.log("_deactivateMove() --> ", "this:", this, " / arguments", arguments);
    var sequence = $.packshotViewer.data.instances[insIndex].galleries[galIndex].sequences[seqIndex];

    $(elementId + ".move")
      .removeClass("active")
      .addClass("inactive");
    sequence.handler.draggable("destroy");
    sequence.handler.data("area").css({cursor: sequence.container.handler.data("reelAreaCursorBackup")});
    sequence.handler.css({cursor: sequence.container.handler.data("reelCursorBackup")});
    sequence.container.handler.removeData("reelCursorBackup");
    sequence.container.handler.removeData("reelAreaCursorBackup");
    if (sequence.mode == "turntable") sequence.handler.reel.handleEvents(["mousedown", Modernizr.touch ? "touchstart" : "dragstart"], "restore", sequence.handler);
  },

  _activateRotate = function(insIndex, galIndex, seqIndex, elementId) {
    if ($.packshotViewer.debug) console.log("_activateRotate() --> ", "this:", this, " / arguments", arguments);

    if ($(elementId + ".rotate").hasClass("inactive")) {
      $(elementId + ".rotate")
        .removeClass("inactive")
        .addClass("active");
      if ($(elementId + ".move").hasClass("active")) _deactivateMove(insIndex, galIndex, seqIndex, elementId);
    }

  },

  _deactivateRotate = function(insIndex, galIndex, seqIndex, elementId) {
    if ($.packshotViewer.debug) console.log("_deactivateRotate() --> ", "this:", this, " / arguments", arguments);

    $(elementId + ".rotate")
      .removeClass("active")
      .addClass("inactive");
  };

  /**
  *
  * WRAPPER METHOD
  *
  **/
  var main = $.fn[packshotViewer] = $[packshotViewer] = function(options) {

    this._init = _init;

    var base = this;

    this.each(function() {
      if (!$.data(this, packshotViewer)) {
        $.data(this, packshotViewer, packshotViewer);
        base._init(this);
      }
    });

    return this;
  }

  main.data = {
    instances: new Array(0)
  };

  main.debug        = false;
  main.platform     = navigator.platform;
  main.tooltip      = "jQueryUI";
  main.useContainer = false;
  main.platform_id  = 1;
  main.quality_id   = 0;


  /**
  *
  * PUBLIC METHODS
  *
  **/

  main.selectGallery = function(insIndex, gallery_id) {
    if ($.packshotViewer.debug) console.log("selectGallery() --> ", "this:", this, " / arguments", arguments);

    var galIndex = _getGalIndex(insIndex, gallery_id);

    var
      callbacks = new $.Callbacks(),
      callback  = function() {
        callbacks.fire(insIndex, galIndex);
        callbacks.empty();
      };

    if ($.packshotViewer.useContainer) {
      _prepareInstance(false, insIndex);

    } else {
      _prepareInstance(true, undefined);
      $.packshotViewer.useContainer = true;
    }

    _prepareSequences(insIndex, galIndex);
    callbacks.add(_initViewer);
    _resizeContainers();
    callback();
  }

})(jQuery, window, document);
