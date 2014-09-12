(function($, window) {

  var resizeWrapper = $.fn.colorbox.resize;

  var fn = {

    resizeContainers: function() {
      var elementId = "#cboxContent ";

      $(elementId + ".packshotViewerContainer")
        .width($("#cboxContent").width() - $(elementId + ".packshotViewerContainer").data("dirtWidth"))
        .height($("#cboxContent").height() - $(elementId + ".packshotViewerContainer").data("dirtHeight"));
      $(elementId + ".reelContainer")
        .width($(elementId + ".packshotViewerContainer").width() - $(elementId + ".reelContainer").data("dirtWidth"))
        .height($(elementId + ".packshotViewerContainer").height() - $(elementId + ".reelContainer").data("dirtHeight") - $(elementId + ".controlsContainer").outerHeight(true));
      $(elementId + ".reelContainer").data("areaWidth", $(elementId + ".reelContainer").width());
      $(elementId + ".reelContainer").data("areaHeight", $(elementId + ".reelContainer").height());
      $(elementId + ".controlsContainer").css("marginLeft", ($(elementId + ".packshotViewerContainer").width() - $(elementId + ".sliderContainer").outerWidth(true)) / 2 + "px");

      $(elementId + ".reel").trigger("zoom", [$(elementId + ".reel")]);
  },

    resize: function(options) {
      var wrapped = resizeWrapper.apply(this, [options]);
      $(".inline").colorbox.resizeContainers();
      return wrapped;
  }
};

$.extend($.fn.colorbox, fn);

})(jQuery, window);
