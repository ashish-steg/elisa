require([  
    "modules/jquery-mozu", 
    "underscore", 
    "hyprlive",
    "hyprlivecontext",
    "modules/api",
    "modules/backbone-mozu", 
    "modules/cart-monitor",
    "modules/models-product", 
    "modules/views-productimages", 
    "modules/jquery-dateinput-localized",
    "shim!modules/elevatezoom[modules/jquery-mozu=jQuery]"
], function ($, _, Hypr, hyprlivecontext, api, Backbone, CartMonitor, ProductModels, ProductImageViews) {

    var ProductView = Backbone.MozuView.extend({
        templateName: 'modules/product/product-detail',
        autoUpdate: ['quantity'],
        additionalEvents: {
            "change [data-mz-product-option]": "onOptionChange",
            "keyup [data-mz-product-option]": "typingTimeOut",
            "blur [data-mz-product-option]": "onOptionChange",
            "click .qty-button": "changeQuantity",
            "click .mz-productdetail-continueshopping": "continueShopping",
            "keypress .mz-productdetail-qty": "sanitizeInput",
            "change .mz-productdetail-qty": "checkQty",
            "change [data-mz-product-option='Tenant~color']": "colorMapping",
            "change [data-mz-product-option='tenant~color']": "colorMapping"

        },
        timeOutVar: "",
        render: function () {
            var me = this;
            if($(document.activeElement).attr("type") == "text"){
                this.model.set("activeElement", $(document.activeElement).data("mz-product-option"));
            } else {
                this.model.set("activeElement", false);
            }
            api.get('wishlist').then(function(wishlist) {
                return wishlist.data.items;
            }).then(function(wishlistItems) {
                me.model.set("inWishlist", false);
                for (var i = 0; i < wishlistItems.length; i++) {
                    for (var j = 0; j < wishlistItems[i].items.length; j++) {
                        if (wishlistItems[i].items[j].product.productCode == me.model.attributes.productCode) {
                            if(me.model.attributes.variations.length > 0){
                                if(wishlistItems[i].items[j].product.variationProductCode == me.model.attributes.variationProductCode){
                                    me.model.set("inWishlist", true);
                                }
                            } else {
                                me.model.set("inWishlist", true);
                            }
                        }
                    }
                }

                if(_.find(me.model.attributes.options.models, function(option){ 
                    return option.attributes.attributeFQN.indexOf("strand") !== -1 || 
                           option.attributes.attributeFQN.indexOf("birthstone") !== -1 ||
                           option.attributes.attributeFQN.indexOf("initial") !== -1;
                    })
                    ){
                    var options = me.model.get("options").models,
                        isComplete = true;
                    var numOfStrands = _.find(options, function(option){
                        return option.get("attributeFQN").toLowerCase() == "tenant~number-of-strands";
                    });
                    var names = _.filter(options, function(option){
                        return option.get("attributeFQN").indexOf("name-mothersbracelet") != -1;
                    });
                    var birthstones = _.filter(options, function(option){
                        return option.get("attributeFQN").indexOf("birthstone") != -1;
                    });
                    if(numOfStrands){
                        for(var strand = 0; strand < numOfStrands.get("value"); strand++){
                            if(names.length) {names[strand].set("isRequired", true);}
                            if(birthstones.length) {birthstones[strand].set("isRequired", true);}
                            if(names.length && !names[strand].attributes.value || birthstones.length && !birthstones[strand].attributes.value){
                                isComplete = false;
                            }
                        }
                        for(var strand2 = names.length-1; strand2 >= numOfStrands.get("value"); strand2--){
                            if(names.length) {names[strand2].set("isRequired", false);}
                            if(birthstones.length) {birthstones[strand2].set("isRequired", false);}
                        }
                        if(names.length){
                            names[0].set("isRequired", true);
                        }
                        if(birthstones.length){
                           birthstones[0].set("isRequired", true);
                        }
                        if(!isComplete){
                            me.model.attributes.purchasableState.isPurchasable = false;
                            me.model.attributes.purchasableState.messages = [{ 
                                message: "Not done configuring",
                                severity: "Info",
                                source: "ConfigurableProduct",
                                validationType:"IncompleteProductConfiguration"
                            }];
                        }
                    } else {
                        me.model.attributes.purchasableState.isPurchasable = true;
                        for(var option = 1; option < options.length; option++){
                            if(options[option-1].get("value")){
                                options[option].set("isShown", "true");
                            }
                        }
                    }

                    $('.mz-productoptions').wrap('<form id="product-options"></form>');
                }

                if(!me.model.notDoneConfiguring()){
                    if(me.model.attributes.inventoryInfo.manageStock && parseInt(me.model.attributes.inventoryInfo.onlineStockAvailable, 10) === 0) {
                        me.model.attributes.purchasableState.messages[0] = {
                            message: "Product is out of stock",
                            severity: "Info",
                            source: "ConfigurableProduct",
                            validationType: "OutOfStock"
                        };
                    }
                }
                me.model.set("isComplete", true);
                Backbone.MozuView.prototype.render.apply(me);

                // change twitter link if iPhone/iPad
                if(/iPhone|iPad|iPod/i.test(navigator.userAgent) ) {
                    $("#twitter").attr("href", "twitter://post?message="+ window.location.href);
                }

                if(me.model.get("activeElement")){
                    var EOS = $("[data-mz-product-option='"+ me.model.get("activeElement") +"']").val(),
                        $activeEl = $("[data-mz-product-option='"+ me.model.get("activeElement") +"']");
                    $activeEl.focus();
                    $activeEl.val('');
                    $activeEl.val(EOS);
                }
                if($(".mz-productoptions-valuecontainer input:radio")){
                    var color = true;
                    if($(".mz-productoptions-valuecontainer input:radio:checked").val()){
                        color = false;
                    }
                    $(".mz-productoptions-valuecontainer input:radio + label").each(function(){
                        if(color){
                            $(this).css({"border-color": "#f00", "box-shadow": "0 0 5px 1px rgba(255, 0, 0, .4)"});
                        } else {
                            $(this).css({"border-color": "#000", "box-shadow": "none"});
                        }
                    });
                }
                $("strong.is-required").siblings("div").children().each(function(){
                    if(!$(this).val()){
                        $(this).css({
                            "border": "red",
                            "box-shadow": "red 0 0 5px 1px"
                        });
                    }
                });

                me.$('[data-mz-is-datepicker]').each(function (ix, dp) {
                    $(dp).dateinput().css('color', Hypr.getThemeSetting('textColor')).on('change  blur', _.bind(me.onOptionChange, me));
                });

            });
        },
        typingTimeOut: function(e){
            var me = this;
            if(me.model.set("startTimeout")){
                clearTimeout(me.timeOutVar);
                me.model.set("startTimeout", true);
                me.timeOutVar = setTimeout(function(){
                    me.model.set("startTimeout", false);
                    me.configure($(e.currentTarget));
                }.bind(e), 1000);
            } else {
                me.model.set("startTimeout", true);
                me.timeOutVar = setTimeout(function(){
                    me.model.set("startTimeout", false);
                    me.configure($(e.currentTarget));
                }.bind(e), 1000);
            }
        },
        onOptionChange: function (e) {
            return this.configure($(e.currentTarget));
        },
        onQuantityChange: _.debounce(function (e) {
            var $qField = $(e.currentTarget),
              newQuantity = parseInt($qField.val(), 10);
            if (!isNaN(newQuantity)) {
                this.model.updateQuantity(newQuantity);
            }
        },500),
        configure: function ($optionEl) {
            var newValue = $optionEl.val(),
                oldValue,
                id = $optionEl.data('mz-product-option'),
                optionEl = $optionEl[0],
                isPicked = (optionEl.type !== "checkbox" && optionEl.type !== "radio") || optionEl.checked,
                option = this.model.get('options').get(id);
            if (option) {
                if (option.get('attributeDetail').inputType === "YesNo") {
                    option.set("value", isPicked);
                } else if (isPicked) {
                    oldValue = option.get('value');
                    if (oldValue !== newValue && !(oldValue === undefined && newValue === '')) {
                        option.set('value', newValue);
                    }
                }
            }
        },
        addToCart: function () {
            this.model.addToCart();
        },
        addToWishlist: function () {
            if(require.mozuData('user').isAnonymous){
                $(".mz-login-modal-wrapper").show();
            } else {
                this.model.addToWishlist();
            }
        },
        checkLocalStores: function (e) {
            var me = this;
            e.preventDefault();
            this.model.whenReady(function () {
                var $localStoresForm = $(e.currentTarget).parents('[data-mz-localstoresform]'),
                    $input = $localStoresForm.find('[data-mz-localstoresform-input]');
                if ($input.length > 0) {
                    $input.val(JSON.stringify(me.model.toJSON()));
                    $localStoresForm[0].submit();
                }
            });

        },
        changeQuantity: function(e){
            var $el = $(e.currentTarget);
            var qty = 0;
            $(".mz-validationmessage").text("");
            if(!$(".mz-productdetail-qty").attr("disabled")){
                if(!$el.hasClass("disabled")){
                    if($el.hasClass("qty-minus")){
                        if($(".mz-productdetail-qty").val() > 0){
                            qty = parseInt($(".mz-productdetail-qty").val(), 10) - 1;

                            if(qty == 1){
                                $el.addClass("disabled");
                            }
                        }
                    } else {
                        qty = parseInt($(".mz-productdetail-qty").val(), 10) + 1;
                        $(".qty-button.qty-minus").removeClass("disabled");
                    }
                    $(".mz-productdetail-qty").val(qty);
                    this.model.set("quantity", qty);
                }
            }
        },
        continueShopping: function(){
            window.history.back();
        },
        sanitizeInput: function (e) {
            var value = String.fromCharCode(e.keyCode);

            value = value.replace(/\D+/, '');

            if (value === '') {
                e.preventDefault();
            }
        },
        checkQty: function(e){
            $(".mz-validationmessage").text("");
            $(e.currentTarget).val(parseInt($(e.currentTarget).val(), 10));
            if($(e.currentTarget).val() === "" || $(e.currentTarget).val() < 1){
                $(e.currentTarget).val(1);
                $(".mz-validationmessage").text("Quantity cannot be null or empty.");
            }
            if(parseInt($(e.currentTarget).val(), 10) === 0){
                this.model.trigger("error", { message: "Validation Error: Quantity cannot be null or empty." });
            }
        },
        print: function(e){
            var newWindow = window.open();
            var html = "";

            html += "<style>body{width:595px;}h2{text-align:center}.productImages{display:flex;flex-direction:row;justify-content:space-around;flex-wrap:wrap;}.option,.property{display:flex;flex-direction:row;justify-content:space-around;-ms-flex-pack:justify;border-bottom:1px solid #000;}.option span,.property span{width:100px}</style>";
            html += "<h2>"+ this.model.get("content").get("productName") +"</h2>";

            html += "<div class='productImages'>";
            $(this.model.get("content").get("productImages")).each(function(){
                html += "<img src='"+ this.imageUrl +"?max=178' style='width: 30%'/>";
            });
            html += "</div>";

            html += "<div class='price'>";
                if(this.model.get("price").get("price")){
                    if(this.model.get("price").get("salePrice")){
                         html += "$"+ this.model.get("price").get("salePrice");
                     }else{
                         html += "$"+ this.model.get("price").get("price");
                     }                
                 } else {
                    html += "$"+ this.model.get("priceRange").get("lower").get("price") +"-$"+ this.model.get("priceRange").get("lower").get("price");
                }
            html += "<div class='info'>";
                html += this.model.get("content").get("productFullDescription") + "<br/>";

                html += "<div class='options'>";
                    $(this.model.get("options").models).each(function(){
                        if(this.attributes.value){
                            html += "<div class='option'>"+ this.get("attributeDetail").name +": "+ this.attributes.value +"</div>";
                        }
                    });
                html += "</div>";

                html += "<div class='properties'>";
                    $(this.model.get("properties")).each(function(){
                        if(this.attributeFQN != "tenant~product-crosssell" && this.attributeFQN != "tenant~product-upsell" && this.attributeFQN != "tenant~archive" && this.attributeFQN != "tenant~badges" && !this.isHidden){
                            if(this.values){
                                var valueLength = this.values.length;
                                html += "<div class='property'><span>"+ this.attributeDetail.name + ":</span><span>";
                                $(this.values).each(function(i){
                                    html += this.stringValue;
                                    if(i != valueLength - 1){
                                        html += ", ";
                                    }
                                });
                                html += "</span></div>";
                            }
                        }
                    });
                html += "</div>";
            html += "</div>";

            newWindow.document.write(html);
            _.delay(function(){
                newWindow.document.close();
                newWindow.focus();
                newWindow.print();
                newWindow.close();
            }, 1000);


        },
        colorMapping: function(e){
            var me = this,
                cdn = hyprlivecontext.locals.siteContext.cdnPrefix +"/cms/files/",
                imgTemplate = Hypr.getTemplate("modules/product/product-images");
            if(this.model.attributes.colorMaps && this.model.attributes.colorMaps.length){
                var color = $(e.currentTarget).val(),
                    colorMapping = _.find(this.model.attributes.colorMaps, function(colorMap){
                        return colorMap.color == color ;
                    });
                
                if(colorMapping.numOfImgsIndex){

                    this.model.attributes.mainImage.cmsId = cdn + this.model.attributes.productCode +"_"+ colorMapping.color +"_1.jpg";
                    this.model.attributes.mainImage.imageUrl = cdn + this.model.attributes.productCode +"_"+ colorMapping.color +"_1.jpg";
                    this.model.attributes.mainImage.src = cdn + this.model.attributes.productCode +"_"+ colorMapping.color +"_1.jpg";
                    this.model.attributes.content.attributes.productImages = [];
                    for(var imgNum = 1; imgNum < colorMapping.numOfImgsIndex; imgNum++){
                        this.model.attributes.content.attributes.productImages.push({
                            altText: "",
                            cmsId: "",
                            imageLabel: null,
                            imageUrl: cdn + this.model.attributes.productCode +"_"+ colorMapping.color +"_"+ imgNum +".jpg",
                            mediaType: null,
                            sequence: imgNum,
                            src: cdn + this.model.attributes.productCode +"_"+ colorMapping.color +"_"+ imgNum +".jpg",
                            videoUrl: null
                        });
                    }

                    $("[data-mz-productimages]").html(imgTemplate.render({
                        model: {
                            mainImage: this.model.attributes.mainImage,
                            content: {
                                productImages: this.model.attributes.content.attributes.productImages
                            },
                            properties: this.model.attributes.properties
                        }
                    }));
                } else {
                    // Re-Render old images
                    var oldImgs = _.find(this.model.attributes.colorMaps, function(colorMap){
                        return colorMap.color == "oldImgs";
                    });
                    this.model.attributes.mainImage = _.clone(oldImgs.imgs[0]);
                    this.model.attributes.content.attributes.productImages = _.clone(oldImgs.imgs);
                    $("[data-mz-productimages]").html(imgTemplate.render({
                        model: {
                            mainImage: this.model.attributes.mainImage,
                            content: {
                                productImages: this.model.attributes.content.attributes.productImages
                            },
                            properties: this.model.attributes.properties
                        }
                    }));
                }
            }
        },
        initialize: function () {
            // handle preset selects, etc
            var me = this,
                cdn = hyprlivecontext.locals.siteContext.cdnPrefix +"/cms/files/",
                imageMapping = _.find(this.model.attributes.properties, function(property){
                    return property.attributeFQN.toLowerCase() == "tenant~color-mapping";
                });
            me.model.set("inWishlist", false);
            this.$('[data-mz-product-option]').each(function () {
                var $this = $(this), isChecked, wasChecked;
                if ($this.val()) {
                    switch ($this.attr('type')) {
                        case "checkbox":
                        case "radio":
                            isChecked = $this.prop('checked');
                            wasChecked = !!$this.attr('checked');
                            if ((isChecked && !wasChecked) || (wasChecked && !isChecked)) {
                                me.configure($this);
                            }
                            break;
                        default:
                            me.configure($this);
                    }
                }
            });

            // Image mapping setup
            function getNumberOfColoredImages(num, color, prod){
                // var http = new XMLHttpRequest();
                // http.open('HEAD', cdn + this.model.attributes.productCode +"_"+ color + "_"+ num +".jpg", false);
                // http.send();
                // return http.status == 404 ? num : getNumberOfColoredImages(num++, color);
                $.get(cdn + prod.model.id +"_"+ color + "_"+ num +".jpg").then(function(){
                    num++;
                    getNumberOfColoredImages(num, color, prod);
                }, function(){
                    prod.model.attributes.colorMaps.push({color: color, numOfImgsIndex: num});
                });
            }

            if(imageMapping && imageMapping.values[0].value){
                this.model.set("colorMaps", []);
                var colors = _.find(this.model.attributes.options.models, function(option){
                                return option.id.toLowerCase() == "tenant~color";
                            });
                $(colors.attributes.values).each(function(){
                    $.get(cdn + me.model.id +"_"+ this.value + "_1.jpg").then(function(){
                        var numberOfImages = getNumberOfColoredImages(2, this.value, me);
                    }.bind(this), function(){
                        me.model.attributes.colorMaps.push({color: this.value, numOfImgsIndex: 0});
                    }.bind(this));
                });
                me.model.attributes.colorMaps.push({color: "oldImgs", imgs: _.clone(this.model.attributes.content.attributes.productImages)});
            }
        }
    });

    $(document).ready(function () {

        var product = ProductModels.Product.fromCurrent();
        product.on('addedtocart', function (cartitem) {
            if (cartitem && (cartitem.data && cartitem.data.id) || cartitem.id) {
                product.isLoading(false);
                window.SoftCartInstance.update().then(function(){
                    var cdn = hyprlivecontext.locals.siteContext.cdnPrefix +"/cms/files/",
                        softCartItem = _.find(window.SoftCartInstance.model.attributes.items.models, function(item){
                            return item.attributes.product.attributes.productCode == product.attributes.productCode;
                        }),
                        imageMapping = _.find(softCartItem.attributes.product.attributes.properties, function(property){
                            return property.attributeFQN.toLowerCase() == "tenant~color-mapping";
                        });
                    if(imageMapping && imageMapping.values[0].value){
                        var color = _.find(softCartItem.attributes.product.attributes.options, function(option){
                            return option.attributeFQN.toLowerCase() == "tenant~color";
                        });
                        softCartItem.attributes.product.set("isImgMapped", true);

                        $.get(cdn + softCartItem.attributes.data.imgUrl).then(function(){
                            this.attributes.product.attributes.imageUrl = cdn + this.attributes.data.imgUrl;
                            window.SoftCartInstance.view.render();
                            window.SoftCartInstance.view.show();
                        }.bind(softCartItem), function(){
                            window.SoftCartInstance.view.render();
                            window.SoftCartInstance.view.show();
                        });
                    } else {
                        window.SoftCartInstance.view.render();
                        window.SoftCartInstance.view.show();
                    }
                    CartMonitor.setCount(window.SoftCartInstance.view.model.count());
                });
            } else {
                product.trigger("error", { message: Hypr.getLabel('unexpectedError') });
            }
        });

        product.on("error", function(err){
            if(err.errorCode == "VALIDATION_CONFLICT" && this.attributes.inventoryInfo.manageStock && this.attributes.inventoryInfo.onlineStockAvailable < this.attributes.quantity){
                err.message = "Validation Error: We're sorry, we only have "+ this.attributes.inventoryInfo.onlineStockAvailable +" available. Those items have been added to your cart.";
                this.set("quantity", this.attributes.inventoryInfo.onlineStockAvailable);
                if (!this.validate()) {
                    api.request("GET", "/api/commerce/carts/current/items").then(function(cartItems){
                        var me = this;
                        var inCart = false;
                        var fulfillMethod = me.get('fulfillmentMethod');
                        $(cartItems.items).each(function(index){
                            if(this.product.productCode == me.attributes.productCode){
                                if(me.attributes.variationProductCode){
                                    if(me.attributes.variationProductCode == this.product.variationProductCode){
                                        inCart = index;
                                        return false;
                                    }
                                } else {
                                    inCart = index;
                                    return false;
                                }
                            }
                        });
                        if(inCart !== false ){
                            api.request("PUT", "/api/commerce/carts/current/items/"+ cartItems.items[inCart].id +"/"+ me.get("quantity"));
                        } else {
                            me.addToCart();
                        }
                    }.bind(this));
                }
            }
            $('[data-mz-message-bar]').each(function(){
                $(this).find(".mz-error-item").html(err.message.substr(18));
            });
        });

        product.on('addedtowishlist', function (cartitem) {
            $('#add-to-wishlist').prop('disabled', 'disabled').children("span").text("SAVED");
            $('#add-to-wishlist').prop('disabled', 'disabled').children("i").css("color", "#ca52ca");
        });

        var productView = new ProductView({
            el: $('#product-detail'),
            model: product,
            messagesEl: $('[data-mz-message-bar]'),
            name: 'productView'
        });

        var productImagesView = new ProductImageViews.ProductPageImagesView({
            el: $('[data-mz-productimages]'),
            model: product,
            name: 'productImagesView'
        });

        window.productView = productView;

        productView.render();
        
        $('body').on('click', '.mz-productimages-thumb', function (e) {
            e.preventDefault();

            var ez = $('#productImg').data('elevateZoom');
            ez.swaptheimage($(this).find('>:first-child').attr('src').replace('?max=50&', '?max=500&'), $(this).find('>:first-child').attr('src').replace('?max=50&', '?'));
            ez.zoomWindow.css("height", $("#productImg").height());
        });

        $('.mz-productdetail-qty').on('blur', function (e) {
            if (parseInt($(e.currentTarget).val(), 10) < 1 || isNaN(parseInt($(e.currentTarget).val(), 10))) {
                $(e.currentTarget).val(1);
            } else if (parseInt($(e.currentTarget).val(), 10).toString() != $(e.currentTarget).val()) {
                $(e.currentTarget).val(1);
            }
        });

        // related product JS
        var prodCodes = "";

        $(".relatedProduct").each(function(){
            prodCodes += "productCode eq "+ $(this).data("mz-prodcode") +" or ";
        });

        if(prodCodes){
            api.request("GET", "/api/commerce/catalog/storefront/products/?filter=tenant~archive ne true and "+ prodCodes.substr(0, prodCodes.length-4)).then(function(e){
                var items = _.filter(e.items, function(item){
                    var property = _.find(item.properties, function(property){ return property.attributeFQN == "tenant~archive"; });
                    if(property){
                        return property.values[0].value === false;
                    } else {
                        return true;
                    }
                });
                if(items.length){
                    $(items).each(function(){
                        var $el = $("[data-mz-prodcode='"+ this.productCode +"']");
                        var price = "";

                        $el.parent().attr("href", "/p/"+ this.productCode);
                        if(this.content.productImages[0]){
                            $el.children("img").attr("src", this.content.productImages[0].imageUrl + "?maxWidth=260&quality=80");
                        }
                        $el.children(".relatedProd-header").text(this.content.productName);
                        $el.children(".relatedProd-productCode").text(this.productCode);
                        if (this.priceRange){
                            if(this.priceRange.lower.salePrice){
                                price = "Now Only <span class='sale'>$"+ this.priceRange.lower.salePrice +"-$"+ this.priceRange.upper +"</span>";
                            } else {
                                price = "<span>$"+ this.priceRange.lower.price +"-$"+ this.priceRange.lower.price +"</span>";
                            }
                        } else {
                            if(this.price.salePrice){
                                price = "Now Only <span class='sale'>$"+ this.price.salePrice +"</span>";
                            } else {
                                price = "<span>$"+ this.price.price +"</span>";
                            }
                        }
                        $el.children(".relatedProd-price").html(price);
                        $el.addClass("complete");
                    });
                } else {
                    $(".relatedProducts").hide();
                }
            });

            $(".relatedProducts .arrow").on("click", function(){
                if($(this).hasClass("relatedProdLeft")){
                    $(this).siblings(".relatedProductsContainer").animate({"margin-left": "-300px"}, 1000, function(){
                        $(this).append($(this).children().first());
                        $(this).css("margin-left", "0");
                    });
                } else {
                    $(this).siblings(".relatedProductsContainer").css("margin-left", "-300px");
                    $(this).siblings(".relatedProductsContainer").prepend($(this).siblings(".relatedProductsContainer").children().last());
                    $(this).siblings(".relatedProductsContainer").animate({"margin-left": "0px"}, 1000, function(){
                    });
                }
            });
        }
    });

    $('#productImg').elevateZoom({
        zoomType: 'inner',
        cursor: 'crosshair',
        responsive: true
    });
    $(window).on('resize', function () {

        // Resize image zoom
        if($(".zoomWindowContainer > div")){
            var imgHeight = $("#productImg").height(),
                imgWidth = $("#productImg").width(),
                zoom = $("#productImg").data("elevateZoom");

            $(".zoomWindowContainer > div").css({
                "width": imgWidth + "px",
                "height": imgHeight + "px"
            });

            zoom.nzWidth = imgWidth;
            zoom.nzHeight = imgHeight;

            zoom.widthRatio = zoom.largeWidth / zoom.nzWidth;
            zoom.heightRatio = zoom.largeHeight / zoom.nzHeight;
        }
    });

    // rebind imagezoom if we ever lose it
    $(document).on("mouseover", "#productImg", function(e){
        if(!$("#productImg").data("elevateZoom")){
            $("#productImg").removeData('elevateZoom');
            $(".zoomWrapper img.zoomed").unwrap();
            $(".zoomContainer").remove();

            $('#productImg').elevateZoom({
                zoomType: 'inner',
                cursor: 'crosshair',
                responsive: true
            });
            $(".zoomWindowContainer > div").css({
                "width": $('#productImg').width() + "px",
                "height": $('#productImg').height() + "px"
            });
        }
    });
    
    //Resize video widget
    var iFrame = $(".mz-l-sidebar iframe");
    if(iFrame.width())
        iFrame.height((iFrame.width() * 0.5625)+ "px");

    $(window).on('resize', function () {
        //Resize video widget
        var iFrame = $(".mz-l-sidebar iframe");
        if(iFrame.width())
            iFrame.height((iFrame.width() * 0.5625)+ "px");

    });

    // Open image in new window
    $("body").on('click', ".zoomWindowContainer div", function(){
        window.open($(".zoomWindowContainer div").css("background-image").replace("url", "").replace(/[('")]+/g, ''));
    });

    // $('[itemprop="image"]').on('mouseover', function (e) {
    //     e.preventDefault();

    //     var width = $(this).width();
    //     var height = $(this).height();
    //     var img = $(this).attr('src');

    //     $('<div id="hoveredImg" style="background-image: url(\'' + img + '\'); background-repeat: no-repeat; background-size: 110%; display: block; width: ' + width + 'px; height: ' + height + 'px; overflow: hidden; position: absolute;"></div>').insertBefore($(this));
    //     var movementStrength = 25;
    //     var height = movementStrength / $(this).height();
    //     var width = movementStrength / $(this).width();
    //     var self = $(this);
    //     $('#hoveredImg').mousemove(function (e) {
    //         var imgX = e.pageX - (self.width() / 2);
    //         var imgY = e.pageY - (self.height() / 2);
    //         var newvalueX = width * imgX * -1 - 25;
    //         var newvalueY = height * imgY * -1 - 50;
    //         console.log('{x: ' + imgX + ', y: ' + imgY + '}');
    //         // $('#hoveredImg').attr('style', 'background-image: url(\'' + img + '\'); background-repeat: no-repeat; background-size: 110%; display: block; width: ' + width + 'px; height: ' + height + 'px; overflow: hidden; position: absolute;');
    //     });
    // });

});
