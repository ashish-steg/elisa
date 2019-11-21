/* globals V: true */
define([
    'modules/jquery-mozu',
    'underscore',
    'hyprlive',
    'modules/api',
    'modules/backbone-mozu',
    'modules/models-cart',
    'modules/cart-monitor',
    'hyprlivecontext',
    'modules/preserve-element-through-render'
], function (
    $,
    _,
    Hypr,
    api,
    Backbone,
    CartModels,
    CartMonitor,
    HyprLiveContext,
    preserveElement
) {
    var CartView = Backbone.MozuView.extend({
        templateName: "modules/cart/cart-table",
        additionalEvents: {
            "click .qty-button": "changeQuantity",
            "change .mz-carttable-qty-field": "checkQty",
            "click [data-mz-action='estimateZipCode']": "estimateZipCode",
            "keyup #zip-code": "checkEstimateZipCode"
        },
        checkEstimateZipCode: function(e){
            if(e.keyCode == 13){
                this.estimateZipCode();
            }
        },
        estimateZipCode: function(){
            var CartData = this.model.apiModel.data;
            var itemArr = [];
            this.model.isLoading(true);
            if(CartData.isEmpty !== true){  
                
                $.each(CartData.items,function(index,obj){
                    var item={};

                    item.quantity=obj.quantity;
                    item.shipsByItself=false;
                    item.unitMeasurements={
                        "height":{
                            "unit":obj.product.measurements.height.unit,
                            "value":obj.product.measurements.height.value
                        },
                        "length":{
                            "unit":obj.product.measurements.length.unit,
                            "value":obj.product.measurements.length.value
                        },
                        "weight":{
                            "unit":obj.product.measurements.weight.unit,
                            "value":obj.product.measurements.weight.value
                        },
                        "width":{
                            "unit":obj.product.measurements.width.unit,
                            "value":obj.product.measurements.width.value
                        }
                    };
                    itemArr.push(item);
                });
            }
              
            var now = new Date();
            now.setHours(now.getHours()+1);
            var responsefiled1={
                "carrierIds": ["custom","ups","usps","fedex"],
                    "destinationAddress" : {
                    "countryCode":"US",
                    "postalOrZipCode":$('#zip-code').val()
                },
                "estimatedShipmentDate" : now, 
                "isDestinationAddressCommercial" : false,
                "isoCurrencyCode" :Hypr.getThemeSetting('shipamtCode'),
                    "items": itemArr,
                "originAddress": {
                    "address1": Hypr.getThemeSetting('shipaddress1'),
                    "cityOrTown":Hypr.getThemeSetting('shipcityOrTown'),
                    "countryCode":Hypr.getThemeSetting('shipcountryCode'),
                    "postalOrZipCode":Hypr.getThemeSetting('shippostalOrZipCode'),
                    "stateOrProvince":Hypr.getThemeSetting('shipstateOrProvince')
                }
                //"shippingServiceTypes":shiptype
            };
                
            api.request('POST',{
              url: '/api/commerce/catalog/storefront/shipping/request-rates',
              iframeTransportUrl: 'https://' + document.location.host + '/receiver?receiverVersion=2'
            },responsefiled1).then(function(resp){
                $('#zip-code').val('');
                var chooseShip="";
                var shippingRates=[];
                
                $.each(resp.rates,function(index,obj){
                    $.each(obj.shippingRates,function(i,o){
                            if(o.amount>=0){
                                shippingRates.push(o);
                            }
                        });
                    });
               
                    var sortedRates = shippingRates.sort(function(a,b){
                        if(a.amount !== undefined || b.amount !== undefined){
                            return a.amount - b.amount;
                        }
                    });
              
                    $.each(sortedRates,function(i,o){
                        if(o.amount>=0){
                            chooseShip+='<div><span>'+ o.content.name +': </span> $'+ o.amount+'</div>';
                        }
                    });
                $('.mz-chooseestimate').html(chooseShip);
                this.model.isLoading(false);
            }.bind(this));
        },
        login: function(){
             
        },
        exitPopup: function(){

        },
        initialize: function () {
            var me = this;

            //setup coupon code text box enter.
            this.listenTo(this.model, 'change:couponCode', this.onEnterCouponCode, this);
            this.codeEntered = !!this.model.get('couponCode');
            this.$el.on('keypress', 'input', function (e) {
                if (e.which === 13) {
                    if (me.codeEntered) {
                        me.handleEnterKey();
                    }
                    return false;
                }
            });


            var visaCheckoutSettings = HyprLiveContext.locals.siteContext.checkoutSettings.visaCheckout;
            var pageContext = require.mozuData('pagecontext');
            if (visaCheckoutSettings.isEnabled) {
                window.onVisaCheckoutReady = initVisaCheckout;
                require([pageContext.visaCheckoutJavaScriptSdkUrl], initVisaCheckout);
            }
        },
        render: function() {
            preserveElement(this, ['.v-button'], function() {
                var cdn = HyprLiveContext.locals.siteContext.cdnPrefix +"/cms/files/";
                $(this.model.attributes.items.models).each(function(index, item){
                    var imageMapping = _.find(item.attributes.product.attributes.properties, function(property){
                        return property.attributeFQN.toLowerCase() == "tenant~color-mapping";
                    });
                    if(imageMapping && !item.get("isImgMapped") && imageMapping.values[0].value){

                        item.set("isImgMapped", true);
                        var color = _.find(item.attributes.product.attributes.options, function(option){
                            return option.attributeFQN.toLowerCase() == "tenant~color";
                        });

                        $.get(cdn + item.attributes.product.attributes.productCode +"_"+ color.value + "_1.jpg").then(function(){
                            item.attributes.product.attributes.imageUrl = cdn + item.attributes.product.attributes.productCode +"_"+ color.value + "_1.jpg";
                            Backbone.MozuView.prototype.render.call(this);
                        }.bind(this));
                    }
                }.bind(this));
                Backbone.MozuView.prototype.render.call(this);
            });
            if(this.model.attributes.items.length === 0){
                $("#empty-cart-continue").parent().parent().hide();
            }
        },
        changeQuantity: function(e){
            var $el = $(e.currentTarget);
            var qty = 0;
            if(!$el.hasClass("disabled")){
                if($el.hasClass("qty-minus")){
                    if($el.siblings(".mz-carttable-qty-field").val() > 0){
                        qty = parseInt($el.siblings(".mz-carttable-qty-field").val(), 10) - 1;
                        
                        if(qty == 1){
                            $el.addClass("disabled");
                        }
                    }
                } else {
                    qty = parseInt($el.siblings(".mz-carttable-qty-field").val(), 10) + 1;
                    $(".qty-button.qty-minus").removeClass("disabled");
                }
                $el.siblings(".mz-carttable-qty-field").val(qty);
                $el.siblings(".mz-carttable-qty-field").trigger("blur");
            }
        },
        checkQty: function(e){
            $(e.currentTarget).val(parseInt($(e.currentTarget).val(), 10));
            if($(e.currentTarget).val() === "" || $(e.currentTarget).val() < 1){
                $(e.currentTarget).val(1);
                $(".mz-validationmessage").text("Quantity cannot be null or empty.");
            }
            if(parseInt($(e.currentTarget).val(), 10) === 0){
                this.model.trigger("error", { message: "Validation Error: Quantity cannot be null or empty." });
            }
        },
        continueShopping: function(e){
            e.preventDefault();
            window.history.back();
        },
        updateQuantity: _.debounce(function (e) {
            var $qField = $(e.currentTarget),
                newQuantity = parseInt($qField.val(), 10),
                id = $qField.data('mz-cart-item'),
                item = this.model.get("items").get(id);

            if (item && !isNaN(newQuantity)) {
                item.set('quantity', newQuantity);
                item.saveQuantity();
            }
        },400),
        removeItem: function(e) {
            if(require.mozuData('pagecontext').isEditMode) {
                // 65954
                // Prevents removal of test product while in editmode
                // on the cart template
                return false;
            }
            var $removeButton = $(e.currentTarget),
                id = $removeButton.data('mz-cart-item');
            this.removeItemPopup(id);
            return false;
        },
        removeItemPopup: function(id){
            var me = this;
            $(".removeItemPopupOverlay").attr("data-mz-id", id).show();
            $(".removeItemBtn").off("click");
            $(".removeItemBtn").on("click", function(){
                if($(this).data('mz-value')) {
                    me.model.removeItem(id).then(function(e){
                        window.SoftCartInstance.update().then(function(){
                            window.SoftCartInstance.view.render();
                        });
                    });
                    $(".removeItemPopupOverlay").hide();
                } else {
                    $(".removeItemPopupOverlay").hide();
                }
            });
            
        },
        empty: function() {
            this.model.apiDel().then(function() {
                window.location.reload();
            });
        },
        proceedToCheckout: function (e) {
            this.model.isLoading(true);
            if(!require.mozuData("user").isAuthenticated){
                e.preventDefault();
                $(".guestCheckout").show();
                this.model.isLoading(false);
            }
        },
        addCoupon: function () {
            var self = this;
            this.model.addCoupon().ensure(function () {
                self.model.unset('couponCode');
                self.render();
            });
        },
        onEnterCouponCode: function (model, code) {
            if (code && !this.codeEntered) {
                this.codeEntered = true;
                this.$el.find('button').prop('disabled', false);
            }
            if (!code && this.codeEntered) {
                this.codeEntered = false;
                this.$el.find('button').prop('disabled', true);
            }
        },
        autoUpdate: [
            'couponCode'
        ],
        handleEnterKey: function () {
            this.addCoupon();
        }
    });

    /* begin visa checkout */
    function initVisaCheckout (model, subtotal) {
        var delay = 500;
        var visaCheckoutSettings = HyprLiveContext.locals.siteContext.checkoutSettings.visaCheckout;
        var apiKey = visaCheckoutSettings.apiKey;
        var clientId = visaCheckoutSettings.clientId;

        // if this function is being called on init rather than after updating cart total
        if (!model) {
            model = CartModels.Cart.fromCurrent();
            subtotal = model.get('subtotal');
            delay = 0;

            // on success, attach the encoded payment data to the window
            // then turn the cart into an order and advance to checkout
            V.on("payment.success", function(payment) {
                // payment here is an object, not a string. we'll stringify it later
                var $form = $('#cartform');

                _.each({

                    digitalWalletData: JSON.stringify(payment),
                    digitalWalletType: "VisaCheckout"

                }, function(value, key) {

                    $form.append($('<input />', {
                        type: 'hidden',
                        name: key,
                        value: value
                    }));

                });

                $form.submit();

            });

        }

        // delay V.init() while we wait for MozuView to re-render
        // we could probably listen for a "render" event instead
        _.delay(V.init, delay, {
            apikey: apiKey,
            clientId: clientId,
            paymentRequest: {
                currencyCode: model ? model.get('currencyCode') : 'USD',
                subtotal: "" + subtotal
            }
        });
    }
    /* end visa checkout */

    $(document).ready(function() {
        var cartModel = CartModels.Cart.fromCurrent(),
            cartViews = {

                cartView: new CartView({
                    name: 'cartView',
                    el: $('#cart'),
                    model: cartModel,
                    messagesEl: $('[data-mz-message-bar]')
                })

            };

        cartModel.on('ordercreated', function (order) {
            cartModel.isLoading(true);
            window.location = "/checkout/" + order.prop('id');
        });

        cartModel.on('sync', function() {
            CartMonitor.setCount(cartModel.count());
        });

        window.cartView = cartViews;
        
        cartViews.cartView.render();

        CartMonitor.setCount(cartModel.count());

        $('.mz-carttable-qty-field').on('blur', function (e) {
            if (parseInt($(this).val(), 10) < 1 || isNaN(parseInt($(this).val(), 10))) {
                $(this).val(1);

                if (!$(this).prev().hasClass('disabled')) {
                    $(this).prev().addClass('disabled');
                }
            } else if (parseInt($(this).val(), 10).toString() != $(this).val()) {
                $(this).val(1);
            } else {
                if (parseInt($(this).val(), 10) > 1) {
                    $(this).prev().removeClass('disabled');
                }
            }
        });

        $("[data-mz-action='cartLogin']").on('click', function(e){
            $(".loginCartError").text("");
            e.preventDefault();
            api.action('customer', 'loginStorefront', {
                email: $("#cartLogin").val(),
                password: $("#cartPassword").val(),
                redirect: "/checkout"
            })
            .then(function(resp){
                $("#cartform").submit();
            }, function(err){
                $(".loginCartError").text(err.message);
            });
        });

        $(".guestCheckout .exit.btn").on("click", function(){
            $(".loginCartError").text("");
            $(".guestCheckout").hide();
        });

        $('#empty-cart-continue').on('click', function (e) {
            e.preventDefault();
            window.history.back();
        });
    });

});
