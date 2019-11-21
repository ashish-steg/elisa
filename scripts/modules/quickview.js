define([
        'modules/jquery-mozu',
        'underscore',
        'hyprlive',
        'hyprlivecontext',
        'modules/models-product',
        'modules/cart-monitor',
        'modules/api',
        'modules/backbone-mozu'
],
function($, _, Hypr, hyprlivecontext, ProductModels, CartMonitor, api, Backbone) {

    var QuickViewView = Backbone.View.extend({
        events: {
            'click .qvButton': 'buttonClicked',
            'change [data-mz-product-option]': 'onOptionChange',
            'blur [data-mz-product-option]': 'onOptionChange',
            'click .mz-productimages-thumb': 'imgChange'
        },

        initialize: function() {
            this.currentProductCode = null;
        },

        imgChange: function (e){
            e.preventDefault();
            $(".quickview .mz-productimages-mainimage").attr("src", $(e.currentTarget).attr("href"));
        },

        onOptionChange: function(e) {
            if (window.quickviewProduct !== null) {
                $(".quickview").addClass("is-loading");
                $(".quickview input, .quickview select").attr("disabled", "disabled");
                return this.configure($(e.currentTarget));
            }
        },

        configure: function($optionEl) {
            var newValue = $optionEl.val(),
                oldValue,
                id = $optionEl.data('mz-product-option'),
                optionEl = $optionEl[0],
                isPicked = (optionEl.type !== 'checkbox' && optionEl.type !== 'radio') || optionEl.checked,
                option = window.prodOptions.get(id),
                product = window.quickviewProduct;
            if (option) {
                if (option.get('attributeDetail').inputType === 'YesNo') {
                    option.set("value", isPicked);
                } else if (isPicked) {
                    oldValue = option.get('value');
                    if (oldValue !== newValue && !(oldValue === undefined && newValue === '')) {
                        option.set('value', newValue);
                    }
                }
            }
                        
            $(".mz-wishlist").removeClass("is-disabled").removeClass("addedToWishList");
            $(".mz-wishlist").children("a").children().attr("src", "/resources/images/icons/wishlistheart.png");
                
            for (var i = 0; i < window.wishlist.length; i++) {                                                      
                for (var j = 0; j < window.wishlist[i].items.length; j++) {
                    if (window.wishlist[i].items[j].product.productCode == product.attributes.productCode) {
                        if(window.wishlist[i].items[j].product.variationProductCode){
                            if(window.wishlist[i].items[j].product.variationProductCode == product.attributes.variationProductCode){
                                $('#product-details-quick-view .mz-wishlist').addClass('addedToWishList');
                                $('#product-details-quick-view .mz-wishlist').children("a").children().attr("src", "/resources/images/icons/wishlistheartSaved.png");
                            }
                        } else {
                            $('#product-details-quick-view .mz-wishlist').addClass('addedToWishList');
                            $('#product-details-quick-view .mz-wishlist').children("a").children().attr("src", "/resources/images/icons/wishlistheartSaved.png");
                        }
                    }
                }
            }
            
            if(product.get("productType") == "MOTHERS BRACELET") {
                var options = window.prodOptions.models,
                    optionModel = [],
                    numOfStrands = _.find(options, function(option){
                        return option.get("attributeFQN").toLowerCase() == "tenant~number-of-strands";
                    }),
                    names = _.filter(options, function(option){
                        return option.get("attributeFQN").indexOf("name-mothersbracelet") != -1;
                    }),
                    birthstones = _.filter(options, function(option){
                        return option.get("attributeFQN").indexOf("birthstone") != -1;
                    }),
                    productOptTemplate = Hypr.getTemplate("modules/product/product-options-mother-bracelet");
                if(numOfStrands){
                    for(var strand = 0; strand < numOfStrands.get("value"); strand++){
                        names[strand].set("isRequired", true);
                        birthstones[strand].set("isRequired", true);
                    }
                    for(var strand2 = names.length-1; strand2 >= numOfStrands.get("value"); strand2--){
                        names[strand2].set("isRequired", false);
                        birthstones[strand2].set("isRequired", false);
                    }
                    names[0].set("isRequired", true);
                    birthstones[0].set("isRequired", true);
                } else {
                    for(var optIndex = 1; optIndex < options.length; optIndex++){
                        if(options[optIndex-1].get("value")){
                            options[optIndex].set("isRequired", true);
                        }
                    }
                }
                
                $(options).each(function(){
                    optionModel.push(this.attributes);
                });
                $(".quickview .mz-productdetail-options").html(productOptTemplate.render({
                    model: {options: optionModel}
                }));
            }

            var isRequiredOptionsSet = true;
            $('[data-mz-product-option]').each(function(opt) {
                var currOptVal = $(this).val();

                var productOptions = window.prodOptions.models;

                for (var i = 0; i < productOptions.length; i++) {
                    var currentOptionInFor = productOptions[i].attributes;

                    if (currentOptionInFor.attributeFQN == $(this).data("mz-product-option")) {
                        if (currentOptionInFor.isRequired) {
                            if (!currOptVal || currOptVal === "" || currOptVal && currOptVal.toLowerCase() == "select") {
                                isRequiredOptionsSet = false;
                            }
                        }
                    }
                }
            });

            product.on("change", function(){
                // Set product price       
                if(window.quickviewProduct.attributes.price.attributes.price){
                    var priceModel = {onSale: product.attributes.price.onSale()},
                        priceTemplate = Hypr.getTemplate("modules/common/price");

                    
                    _.extend(priceModel, product.attributes.price.attributes);

                    $(".quickview .mz-pricestack").html(priceTemplate.render({
                        model: priceModel
                    }));
                }
                if($(".mz-productoptions-valuecontainer input:radio")){
                    var color = "#ff0000";
                    if($(".mz-productoptions-valuecontainer input:radio:checked").val()){
                        color = "#000";
                    }
                    $(".mz-productoptions-valuecontainer input:radio + label").each(function(){
                        $(this).css("border-color", color);
                    });
                }
                $(".mz-productdetail-options input, .mz-productdetail-options select").each(function(){
                    if(($(this).val() && $(this).val().toLowerCase() == "select") || !$(this).val()){
                        $(this).css("border-color", "red");
                    } else {
                        $(this).css("border-color", "black");
                    }
                });
            });

            var prodOptions = [];
            $(product.attributes.options.models).each(function(){
                if(this.attributes.value){
                    prodOptions.push(this);
                }
            });
            product.apiConfigure({options: prodOptions}).then(function(e){

                $(".mz-validationmessage").text("");
                if (isRequiredOptionsSet) {
                    if(window.quickviewProduct.attributes.inventoryInfo.manageStock === true){
                        if (window.quickviewProduct.attributes.inventoryInfo.onlineStockAvailable >= 1) {
                            $('.mz-qty-control').removeClass("disabled");
                            $('input.mz-productdetail-qty').removeAttr('disabled');
                            $('input.mz-productdetail-qty').val('1');

                            $('input.mz-productdetail-qty').attr('max', window.quickviewProduct.attributes.inventoryInfo.onlineStockAvailable);
                            $('button.btnAddToCart').removeAttr('disabled');
                            $('button.btnAddToCart').removeClass('is-disabled');
                        } else {
                            $('input.mz-productdetail-qty').val('1');
                            $('input.mz-productdetail-qty').attr('disabled', 'disabled');
                            $(".mz-qty-control").addClass("disabled");
                            $('button.btnAddToCart').attr('disabled', 'disabled');
                            $('button.btnAddToCart').addClass('is-disabled');
                            if(window.quickviewProduct.attributes.inventoryInfo.onlineStockAvailable !== undefined){
                                $(".mz-validationmessage").text("Product is out of stock");
                            }
                        }
                    } else {
                        $(".mz-qty-control").removeClass("disabled");
                        $('input.mz-productdetail-qty').removeAttr('disabled');
                        $('input.mz-productdetail-qty').val('1');
                        $('button.btnAddToCart').removeAttr('disabled');
                        $('button.btnAddToCart').removeClass('is-disabled');
                    }

                } else {
                    $(".mz-qty-control").addClass("disabled");
                    $('input.mz-productdetail-qty').attr('disabled', 'disabled');

                    $('button.btnAddToCart').attr("disabled", "disabled");
                    $('button.btnAddToCart').addClass('is-disabled');
                }
                $(".quickview input, .quickview select").removeAttr("disabled");
                $(".quickview").removeClass("is-loading");
            });
        },

        render: function() {
            var me = this;
            Backbone.MozuView.prototype.render.apply(this);
            this.$('[data-mz-is-datepicker]').each(function(ix, dp) {
                $(dp).dateinput().css('color', Hypr.getThemeSetting('textColor')).on('change  blur', _.bind(me.onOptionChange, me));
            });
        },

        buttonClicked: function(e) {
            // QUICK VIEW BUTTON CLICKED -- OPEN QUICK VIEW WINDOW
            var self = this;

            window.quickviewProduct = null;
            this.currentProductCode = null;

            // Reset modal dialog content
            $('#product-details-quick-view .modal-content').html('');

            var qvProductCode = $(e.currentTarget).data("target");
            var product = new ProductModels.Product({
                productCode: qvProductCode
            });

            window.quickviewProduct = product;

            this.currentProductCode = qvProductCode;

            product.apiGet().then(function() {
                api.get('wishlist').then(function(wishlist) {
                    return wishlist.data.items;
                }).then(function(wishlistItems) {
                    window.wishlist = wishlistItems;
                    for (var i = 0; i < wishlistItems.length; i++) {
                        for (var j = 0; j < wishlistItems[i].items.length; j++) {
                            if (wishlistItems[i].items[j].product.productCode == product.attributes.productCode) {
                                if(wishlistItems[i].items[j].product.variationProductCode){
                                    if(wishlistItems[i].items[j].product.variationProductCode == window.quickviewProduct.attributes.variationProductCode){
                                        $('#product-details-quick-view .mz-wishlist').addClass('addedToWishList');
                                        $('#product-details-quick-view .mz-wishlist').children("a").children().attr("src", "/resources/images/icons/wishlistheartSaved.png");
                                    }
                                } else {
                                    $('#product-details-quick-view .mz-wishlist').addClass('addedToWishList');
                                    $('#product-details-quick-view .mz-wishlist').children("a").children().attr("src", "/resources/images/icons/wishlistheartSaved.png");
                                }
                            }
                        }
                    }
                });

                if(product.get("productType") == "MOTHERS BRACELET") {
                    var options = product.get("options").models,
                        optionModel = [],
                        numOfStrands = _.find(options, function(option){
                            return option.get("attributeFQN").toLowerCase() == "tenant~number-of-strands";
                        }),
                        names = _.filter(options, function(option){
                            return option.get("attributeFQN").indexOf("name-mothersbracelet") != -1;
                        }),
                        birthstones = _.filter(options, function(option){
                            return option.get("attributeFQN").indexOf("birthstone") != -1;
                        });
                    if(names.length){
                        names[0].set("isRequired", true);
                        birthstones[0].set("isRequired", true);
                    }
                }
                var modalTemplate = Hypr.getTemplate('modules/product/product-quick-view');

                var modalDiv = $('#product-details-quick-view');
                var modalDivContent = $('#product-details-quick-view .modal-content');

                var htmlToSetAsContent = modalTemplate.render({
                    model: product.toJSON({
                        helpers: true
                    })
                });

                // SET OPTIONS
                window.prodOptions = window.quickviewProduct.attributes.options;

                // SET QUICKVIEW POPUP CONTENTS
                modalDivContent.html(htmlToSetAsContent);

                try {
                    $(modalDiv).children().first().css('float', 'none');

                    // ADD LISTENERS AFTER OPENING QUICK VIEW POPUP
                    $(modalDiv).on('show', function(e) {
                        // Check if item is out of stock
                        if(window.quickviewProduct.attributes.inventoryInfo.manageStock){
                            if(parseInt(window.quickviewProduct.attributes.inventoryInfo.onlineStockAvailable, 10) === 0){
                                $(".mz-validationmessage").text("Product is out of stock");
                            }
                        }
                        function getNumberOfColoredImages(num, color, prod){
                            var cdn = hyprlivecontext.locals.siteContext.cdnPrefix +"/cms/files/";

                            $.get(cdn + prod.id +"_"+ color + "_"+ num +".jpg").then(function(){
                                num++;
                                getNumberOfColoredImages(num, color, prod);
                            }, function(){
                                prod.attributes.colorMaps.push({color: color, numOfImgsIndex: num});
                            });
                            
                        }
            
                        // Check for color mapping
                        var imageMapping = _.find(window.quickviewProduct.attributes.properties, function(property){
                                return property.attributeFQN.toLowerCase() == "tenant~color-mapping";
                            }),
                            cdn = hyprlivecontext.locals.siteContext.cdnPrefix +"/cms/files/";

                        if(imageMapping && imageMapping.values[0].value){
                            window.quickviewProduct.set("colorMaps", []);
                            var colors = _.find(window.quickviewProduct.attributes.options.models, function(option){
                                            return option.id.toLowerCase() == "tenant~color";
                                        });
                            $(colors.attributes.values).each(function(){
                                $.get(cdn + window.quickviewProduct.id +"_"+ this.value + "_1.jpg").then(function(){
                                    var numberOfImages = getNumberOfColoredImages(2, this.value, window.quickviewProduct);
                                }.bind(this), function(){
                                    window.quickviewProduct.attributes.colorMaps.push({color: this.value, numOfImgsIndex: 0});
                                }.bind(this));
                            });
                            window.quickviewProduct.attributes.colorMaps.push({color: "oldImgs", imgs: _.clone(window.quickviewProduct.attributes.content.attributes.productImages)});
                        }

                        // REMOVE PREVIOUS EVENTS (IF ANY)
                        $('#product-details-quick-view').off('click', 'button.btnAddToCart');
                        $('#product-details-quick-view').off('click', '.mz-wishlist');
                        $('#product-details-quick-view').off('click', '.mz-qty-control');
                        $('#product-details-quick-view').off('click', '.mz-productdetail-qty');
                        $('#product-details-quick-view').off('click', '.continueshopping');
                        $('#product-details-quick-view').off('click', '.color_swatch');
                        $(".quickview").off('click');

                        // SHOW ERROR ON FIELDS NOT FILLED IN
                        if($(".mz-productoptions-valuecontainer input:radio")){
                            var color = "#ff0000";
                            if($(".mz-productoptions-valuecontainer input:radio:checked").val()){
                                color = "#000";
                            }
                            $(".mz-productoptions-valuecontainer input:radio + label").each(function(){
                                $(this).css("border-color", color);
                            });
                        }
                        $(".mz-productdetail-options input, .mz-productdetail-options select").each(function(){
                            if(($(this).val() && $(this).val().toLowerCase() == "select") || !$(this).val()){
                                $(this).css("border-color", "red");
                            } else {
                                $(this).css("border-color", "black");
                            }
                        });
                        // ADD LISTENER FOR ADD TO CART
                        $('#product-details-quick-view').on('click', 'button.btnAddToCart', function() {
                            var newQty = $('.mz-productdetail-qty').val();
                            if($('.mz-productdetail-qty').val() > 0){
                                if(window.quickviewProduct.attributes.inventoryInfo.manageStock === true){
                                    if (window.quickviewProduct.attributes.inventoryInfo.onlineStockAvailable >= newQty) {
                                        window.quickviewProduct.apiAddToCart({
                                            quantity: newQty
                                        }).then(function(){
                                            window.SoftCartInstance.update().then(function(){
                                                window.SoftCartInstance.view.render();
                                                window.SoftCartInstance.view.show();
                                                CartMonitor.setCount(window.SoftCartInstance.view.model.count());
                                            });
                                            $(".mz-validationmessage").text("");
                                            $(modalDiv).hide();
                                        }, function(err){
                                            $(".mz-validationmessage").text("We're sorry, we only have "+ window.quickviewProduct.attributes.inventoryInfo.onlineStockAvailable +" available. Those items have been added to your cart.");
                                        });
                                    } else {
                                        // Add error message not enough inventory
                                        $(".mz-validationmessage").text("We're sorry, we only have "+ window.quickviewProduct.attributes.inventoryInfo.onlineStockAvailable +" available. Those items have been added to your cart.");
                                        window.quickviewProduct.apiAddToCart({
                                            quantity: window.quickviewProduct.attributes.inventoryInfo.onlineStockAvailable
                                        }).then(function(){
                                            window.SoftCartInstance.update().then(function(){
                                                window.SoftCartInstance.view.render();
                                                window.SoftCartInstance.view.show();
                                                CartMonitor.setCount(window.SoftCartInstance.view.model.count());
                                            });
                                        });
                                    }
                                } else {
                                    window.quickviewProduct.apiAddToCart({
                                        quantity: newQty
                                    }).then(function(){
                                        window.SoftCartInstance.update().then(function(){
                                            window.SoftCartInstance.view.render();
                                            window.SoftCartInstance.view.show();
                                            CartMonitor.setCount(window.SoftCartInstance.view.model.count());
                                        });
                                    });
                                    $(".mz-validationmessage").text("");
                                    $(modalDiv).hide();
                                }
                            } else {
                                // Add error message no quantity selected
                                $(".mz-validationmessage").text("Please enter a valid quantity");
                            }
                        });

                        // ADD LISTENER FOR CONTINUE SHOPPING
                        $("#product-details-quick-view").on("click", ".continueshopping", function(){
                            $(modalDiv).hide();
                        });

                        // ADD LISTENER FOR EXIT BUTTON
                        $("#product-details-quick-view").on("click", ".close", function(){
                            $(modalDiv).hide();
                        });

                        // ADD LISTENER FOR CLICK OUTSIDE OF QUICKVIEW
                        $(".quickview").on("click", function(e){
                            if(e.target == this){
                                $(modalDiv).hide();
                            }
                        });

                        // ADD LISTENER FOR INVALID QUANTITY
                        $("#product-details-quick-view").on("change", ".mz-productdetail-qty", function(e){
                            $(".mz-validationmessage").text("");
                            $(e.currentTarget).val(parseInt($(e.currentTarget).val(), 10));
                            if($(e.currentTarget).val() === "" || $(e.currentTarget).val() < 1){
                                $(e.currentTarget).val(1);
                                $(".mz-validationmessage").text("Quantity cannot be null or empty.");
                            }
                        });
                            
                        // ADD LISTENER FOR QUANTITY CHANGE
                        $("#product-details-quick-view").on("click", ".mz-qty-control", function(e){
                            var $el = $(e.currentTarget);
                            if(!$el.hasClass("disabled")){
                                if($el.hasClass("plus")){
                                    if(window.quickviewProduct.attributes.inventoryInfo.manageStock === true){
                                        if (window.quickviewProduct.attributes.inventoryInfo.onlineStockAvailable > parseInt($(".mz-productdetail-qty").val(), 10)) {
                                            $(".mz-productdetail-qty").val(parseInt($(".mz-productdetail-qty").val(), 10)+1);
                                        } else {
                                            $(".mz-validationmessage").text("We're sorry, we only have "+ window.quickviewProduct.attributes.inventoryInfo.onlineStockAvailable +" available.");
                                        }
                                    } else {
                                        $(".mz-productdetail-qty").val(parseInt($(".mz-productdetail-qty").val(), 10)+1);
                                    }
                                } else {
                                    if($(".mz-productdetail-qty").val() > 1){
                                        $(".mz-productdetail-qty").val(parseInt($(".mz-productdetail-qty").val(), 10)-1);
                                    }
                                }
                            } else {
                                $(".validationMessage").text("Please select product attributes");
                            }
                        });
                        
                        // ADD LISTENER FOR COLOR SWATCH CHANGE
                        $('#product-details-quick-view').on("click", ".color_swatch", function(event){
                            var $el = $(event.currentTarget),
                                $parentEl = $(".quickview .mz-productimages"),
                                product = window.quickviewProduct,
                                productCode = product.attributes.productCode,
                                cdn = hyprlivecontext.locals.siteContext.cdnPrefix +"/cms/files/",
                                imgTemplate = Hypr.getTemplate("modules/product/product-images");
                            if(product.attributes.colorMaps && product.attributes.colorMaps.length){
                                var color = $el.attr("for").substr(13),
                                    colorMapping = _.find(product.attributes.colorMaps, function(colorMap){
                                        return colorMap.color.toLowerCase() == color.toLowerCase() ;
                                    });
                                console.log('test');
                                if(colorMapping.numOfImgsIndex){
                                    product.attributes.mainImage = {
                                        altText: "",
                                        cmdId: "",
                                        imageLabel: null,
                                        imageUrl: cdn + productCode +"_"+ colorMapping.color +"_1.jpg",
                                        mediaType: null,
                                        sequence: 1,
                                        src: cdn + productCode +"_"+ colorMapping.color +"_1.jpg",
                                        videoUrl: null
                                    };
                                    product.attributes.content.attributes.productImages = [];
                                    for(var imgNum = 1; imgNum < colorMapping.numOfImgsIndex; imgNum++){
                                        product.attributes.content.attributes.productImages.push({
                                            altText: "",
                                            cmdId: "",
                                            imageLabel: null,
                                            imageUrl: cdn + productCode +"_"+ colorMapping.color +"_"+ imgNum +".jpg",
                                            mediaType: null,
                                            sequence: imgNum + 1,
                                            src: cdn + productCode +"_"+ colorMapping.color +"_"+ imgNum +".jpg",
                                            videoUrl: null
                                        });
                                    }

                                    $("[data-mz-productimages]").html(imgTemplate.render({
                                        model: {
                                            mainImage: product.attributes.mainImage,
                                            content: {
                                                productImages: product.attributes.content.attributes.productImages
                                            },
                                            properties: product.attributes.properties
                                        }
                                    }));
                                } else {
                                    // Re-Render old images
                                    var oldImgs = _.find(product.attributes.colorMaps, function(colorMap){
                                        return colorMap.color == "oldImgs";
                                    });
                                    product.attributes.mainImage = _.clone(oldImgs.imgs[0]);
                                    product.attributes.content.attributes.productImages = _.clone(oldImgs.imgs);
                                    $("[data-mz-productimages]").html(imgTemplate.render({
                                        model: {
                                            mainImage: product.attributes.mainImage,
                                            content: {
                                                productImages: product.attributes.content.attributes.productImages
                                            },
                                            properties: product.attributes.properties
                                        }
                                    }));
                                }
                            }
                            // get list of images
                        });

                        // ADD LISTENER FOR ADD TO WISHLIST
                        $('#product-details-quick-view').on('click', '.mz-wishlist:not(".is-disabled"):not(".addedToWishList")', function(e) {
                            if(require.mozuData("user").isAnonymous){
                                $(modalDiv).hide();
                                $(".mz-login-modal-wrapper").show();
                            } else {
                               window.quickviewProduct.addToWishlist({
                                    quantity: 1
                                });

                                try {
                                    product.on('addedtowishlist', function(wishlistitem) {
                                        $('#product-details-quick-view .mz-wishlist').removeClass('is-disabled').addClass('addedToWishList');
                                        $('#product-details-quick-view .mz-wishlist').children("a").children().attr("src", "/resources/images/icons/wishlistheartSaved.png");
                                        for (var i = 0; i < window.wishlist.length; i++) {
                                            window.wishlist[i].items.push(window.quickviewProduct);
                                        }
                                    });
                                } catch (err) {
                                    console.log('Error Obj:' + err);
                                }
                            }
                        });
                    }); // END OF ADDING LISTENERS

                    $(modalDiv).on('hidden.bs.modal', function(e) {
                        window.quickviewProduct = null;
                    });

                    $(modalDiv).show().trigger("show");
                } catch (err) {
                    console.log('Error Obj:' + err);
                }

                // ADD INLINE WIDTH FOR IE
                $('.modal-content.quickview-modal').attr('style', $('.modal-content.quickview-modal').attr('style') + 'width: ' + $('.modal-body > [itemtype="http://schema.org/Product"]').width() + 'px');
                $('.modal-dialog[role="document"]').css('width', $('.modal-body > [itemtype="http://schema.org/Product"]').width() + 'px');
            });
        }
    }); // END OF PRODUCT DETAILS QUICK VIEW

    $(document).ready(function(){
        var quickViewView = new QuickViewView({
            el: $('body')
        });
    });
});