define(['modules/jquery-mozu', 'underscore', "modules/backbone-mozu", 'hyprlive'], function ($jQuery, _, Backbone, Hypr) {

    var ProductPageImagesView = Backbone.MozuView.extend({
        name: 'ProductPageImagesView',
        templateName: 'modules/product/product-images',
        events: {
            'click [data-mz-productimage-thumb]': 'switchImage'
        },
        initialize: function () {
            // preload images
        },
        switchImage: function (e) {
            var $thumb = $jQuery(e.currentTarget),
                cacheKey = Hypr.engine.options.locals.siteContext.generalSettings.cdnCacheBustKey,
                _parent = this;
            this.selectedImageIx = $thumb.data('mz-productimage-thumb');
            this.updateMainImage();
            var ez = $jQuery('#productImg').data('elevateZoom');
            ez.swaptheimage($thumb.find('>:first-child').attr('src').replace('?max=50&', '?max=500&'), $thumb.find('>:first-child').attr('src').replace('?max=50&', '?'));
            return false;
        },
        updateMainImage: function () {
            var _parent = this,
                img = _.find(this.model.get("content").get("productImages"), function(img){ return img.sequence == _parent.selectedImageIx; });
            
            this.$jQuery('[data-mz-productimage-main]')
                .prop('src', img.src)
                .prop('alt', img.alt);
            if(this.$jQuery('[data-mz-productimage-main]')[0].complete){
                $jQuery(".zoomWindowContainer > div").css({
                    "width": $jQuery('#productImg').width() + "px",
                    "height": $jQuery('#productImg').height() + "px"
                });
            } else {
                this.$jQuery('[data-mz-productimage-main]').on("load", function(){
                    $jQuery(".zoomWindowContainer > div").css({
                        "width": $jQuery('#productImg').width() + "px",
                        "height": $jQuery('#productImg').height() + "px"
                    });
                });
            }
        },
        render: function () {
            if(this.model.get("content").get("productImages")[0] == this.imageCache[0])
            Backbone.MozuView.prototype.render.apply(this, arguments);
            this.updateMainImage();
        }
    });


    return {
        ProductPageImagesView: ProductPageImagesView
    };

});
