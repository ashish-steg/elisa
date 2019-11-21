define([
    'modules/backbone-mozu', 
    'modules/api', 
    'hyprlive', 
    'hyprlivecontext', 
    'modules/jquery-mozu', 
    'underscore',
    'modules/models-product',
    'modules/cart-monitor',
    'modules/models-customer', 
    'modules/views-paging', 
    'modules/editable-view'
], function(
    Backbone, 
    api, 
    Hypr, 
    HyprLiveContext, 
    $, 
    _, 
    ProductModels,
    CartMonitor,
    CustomerModels, 
    PagingViews, 
    EditableView
) {

    var AccountSettingsView = EditableView.extend({
        templateName: 'modules/my-account/my-account-personal-information',
        autoUpdate: [
            'firstName',
            'lastName',
            'emailAddress',
            'acceptsMarketing'
        ],
        constructor: function () {
            EditableView.apply(this, arguments);
            this.editing = false;
            this.editing.password = false;
            this.invalidFields = {};
        },
        initialize: function () {
            return this.model.getAttributes().then(function (customer) {
                customer.get('attributes').each(function (attribute) {
                    attribute.set('attributeDefinitionId', attribute.get('id'));
                });

                return customer;
            });
        },
        updateAttribute: function (e) {
            var self = this;
            var attributeFQN = e.currentTarget.getAttribute('data-mz-attribute');
            var attribute = this.model.get('attributes').findWhere({ attributeFQN: attributeFQN });
            var nextValue = attribute.get('inputType') === 'YesNo' ? $(e.currentTarget).prop('checked') : $(e.currentTarget).val();

            attribute.set('values', [nextValue]);
            attribute.validate('values', {
                valid: function (view, attr, error) {
                    self.$('[data-mz-attribute="' + attributeFQN + '"]').removeClass('is-invalid')
                        .next('[data-mz-validationmessage-for="' + attr + '"]').text('');
                },
                invalid: function (view, attr, error) {
                    self.$('[data-mz-attribute="' + attributeFQN + '"]').addClass('is-invalid')
                        .next('[data-mz-validationmessage-for="' + attr + '"]').text(error);
                }
            });
        },
        startEdit: function (event) {
            event.preventDefault();
            this.editing = true;
            this.render();
        },
        cancelEdit: function () {
            this.editing = false;
            this.afterEdit();
        },
        finishEdit: function () {
            var self = this;

            this.doModelAction('apiUpdate').then(function () {
                self.editing = false;
            }).otherwise(function () {
                self.editing = true;
            }).ensure(function () {
                self.afterEdit();
            });
        },
        afterEdit: function () {
            var self = this;

            self.initialize().ensure(function () {
                self.render();
            });
        }
    });

    var PasswordView = EditableView.extend({
        templateName: 'modules/my-account/my-account-password',
        autoUpdate: [
            'oldPassword',
            'password',
            'confirmPassword'
        ],
        startEditPassword: function (event) {
            event.preventDefault();
            this.editing.password = true;
            this.render();
        },
        finishEditPassword: function() {
            var self = this;
            this.doModelAction('changePassword').then(function(resp) {
                _.delay(function() {
                    self.$('[data-mz-validationmessage-for="passwordChanged"]').show().text(Hypr.getLabel('passwordChanged')).fadeOut(3000);
                }, 250);
            }, function(err) {
                self.$('[data-mz-validationmessage-for="password"]').show().text(err.message);
            }, function() {
                self.editing.password = true;
        });
        console.log(PasswordView());
        this.editing.password = false;
    },
    cancelEditPassword: function() {
        this.editing.password = false;
        this.render();
    }
    });

    var WishListView = EditableView.extend({
        templateName: 'modules/my-account/my-account-wishlist',
        initialize: function() {
            var me = this;
            // Get current user wishlist
            api.request("GET", "/api/commerce/wishlists").then(function(e){
                var items;
                try {
                    e.items.forEach(function(item){
                        if(item.name.toLowerCase() == "my_wishlist"){
                            items = item.items;
                        }
                    });
                } catch(error) {}

                // No items in the wishlist
                if (!items) {
                        return;
                }

                // set items to model and start page at 1
                me.model.set('items', items);
                me.model.set('page', 1);
                me.model.set('pageSize', 20);
                me.model.set('pages', []);

                // Set master list of items
                me.items = me.model.attributes.items.models;
                for(var i = 0; i < me.model.attributes.items.length/me.model.get('pageSize'); i++){
                    me.model.attributes.pages[i] = i+1;
                }

                // Syn model
                me.model.trigger('sync');

                // Start render
                me.render();
            }, function(err){
                // error calling the wishlist
                me.render();
            });
        },
        render: function() {
            var me= this;

            // Each time render is called, check for begning and end of page
            var pageEnd = (me.model.get('page')*me.model.get('pageSize'));
            var pageStart = pageEnd-me.model.get('pageSize');
            var pageSize = 0;

            // clear display list of items
            me.model.attributes.items.models = [];
            if(me.model.get('displayMode') === undefined){
            me.model.set('displayMode','grid');
            }

            // add items from master list to display list based on start and end location
            // i = loop index from begning of paged list to end of paged list
            for(var i=pageStart; i < pageEnd; i++){
                if(me.items[i]){
                    me.model.attributes.items.models[pageSize] = me.items[i];
                    if(i > me.items.length-1){
                        // end loop if reached the end of wishlist items
                        break;
                    }
                    pageSize++;
                } else {
                    pageSize--;
                    break;
                }
            }

            // Set length of page
            me.model.attributes.items.length = pageSize;

            // render page
            var cdn = HyprLiveContext.locals.siteContext.cdnPrefix +"/cms/files/";
            $(me.model.attributes.items.models).each(function(index, item){
                var imageMapping = _.find(item.attributes.product.attributes.properties, function(property){
                    return property.attributeFQN.toLowerCase() == "tenant~color-mapping";
                });
                if(imageMapping && !item.get("isImgMapped") && imageMapping.values[0].value){

                    var color = _.find(item.attributes.product.attributes.options.models, function(option){
                        return option.attributes.attributeFQN.toLowerCase() == "tenant~color";
                    });

                    $.get(cdn + item.attributes.product.attributes.productCode +"_"+ color.attributes.value + "_1.jpg").then(function(){
                        item.attributes.product.attributes.imageUrl = cdn + item.attributes.product.attributes.productCode +"_"+ color.attributes.value + "_1.jpg";
                        item.set("isImgMapped", cdn + item.attributes.product.attributes.productCode +"_"+ color.attributes.value + "_1.jpg");
                        EditableView.prototype.render.call(this);
                    }.bind(this), function(){
                        item.set("isImgMapped", item.attributes.product.get("imageUrl"));
                    });
                } else if(item.get("isImgMapped") && item.get("isImgMapped") !== true){
                    item.attributes.product.set("imageUrl", item.get("isImgMapped"));
                }
            }.bind(this));
            EditableView.prototype.render.call(me);

            // Optional based on core version
            /*
            $('[addMultipleItemsToCart]').click(me.addMultipleItemsToCart.bind(me));
            $('[deleteMultipleItemswishlist]').click(me.finishRemoveItem.bind(me));
            me.getInventory();
            me.afterRender();
            */

            $('.remove-wishlist-item').on('click', function (e) {
                e.preventDefault();
                $('div.mz-remove-wishlist-confirm > div.modal > button[data-mz-action="remove"]').attr('data-mz-product', $(this).attr('data-mz-item-id'));
                $('.mz-remove-wishlist-confirm').show();
            });

            $('#cancel-remove-wishlist-item').on('click', function (e) {
                $('.mz-remove-wishlist-confirm').hide();
            });

            $('#remove-wishlist-item').on('click', function (e) {
                $('.mz-remove-wishlist-confirm').hide();
                var itemId = $(this).attr('data-mz-product'),
                    wishlistId = me.model.get('id');
                me.finishRemoveItem(itemId);
            });
        },
        // change page on click
        favPage: function(e){
            var me = this;
            e.preventDefault();
            // scroll window to top of page
            $("html, body").animate({ scrollTop: 0 }, "slow");
            // set page number
            me.model.set('page', $(e.currentTarget).data('mz-page-num'));
            me.render();
        },
        favPrevious: function(e){
            var me = this;
            e.preventDefault();
            // scroll window to top of page
            $("html, body").animate({ scrollTop: 0 }, "slow");
            // set page number
            me.model.set('page', (me.model.get('page')-1));
            me.render();
        },
        favNext: function(e){
            var me = this;
            e.preventDefault();
            // scroll window to top of page
            $("html, body").animate({ scrollTop: 0 }, "slow");
            // set page number
            me.model.set('page', (me.model.get('page')+1));
            me.render();
        },
        addItemToCart: function (e) {
            var self = this, $target = $(e.currentTarget),
                id = $target.data('mzItemId');
            if (id) {
                this.editing.added = id;
                window.SoftCartInstance.update().then(function(){
                    window.SoftCartInstance.view.render();
                    window.SoftCartInstance.view.show();
                    window.SoftCartInstance.update().then(function () {
                        CartMonitor.setCount(window.SoftCartInstance.view.model.count());
                    });
                });
                return this.doModelAction('addItemToCart', id);
            }
        },
        doNotRemove: function() {
            this.editing.added = false;
            this.editing.remove = false;
            this.render();
        },
        beginRemoveItem: function (e) {
            e.preventDefault();
            var self = this, $target = $(e.currentTarget), id = $target.data('mzItemId');
            if (id) {
                this.editing.remove = id;
                if (window.confirm('Are you sure you want to delete this item?') === true) {
                    this.finishRemoveItem(id);
                }
                this.render();
            }
        },
        continueRemoveItem: function () {
            return true;
        },
        finishRemoveItem: function(id) {
            var self = this;
            if (id) {
                var removeWishId = id;
                return this.model.apiDeleteItem(id).then(function () {
                    self.editing.remove = false;
                    var itemToRemove = self.model.get('items').where({ id: removeWishId });
                    if (itemToRemove) {
                        self.model.get('items').remove(itemToRemove);
                        self.render();
                        location.reload();
                    }
                });
            }
        }
    });
    var QuickOrderView = Backbone.MozuView.extend({
        templateName: "modules/my-account/my-account-quick-order-listing",
        additionalEvents: {
            "change [data-mz-value='quantity']": "checkQuantity",
            "keypress [data-mz-value='quantity']": "sanitizeInput"
        },
        qty: function(e){
            var $el = $(e.currentTarget);
            var $qtyField = $el.siblings(".mz-productdetail-qty");
            $('#account-messages').parent().hide();
            if(!$el.hasClass("disabled")) {
                if($el.hasClass("qty-minus")){
                   $qtyField.val(parseInt($qtyField.val(), 10) - 1);
                   if($qtyField.val() <= 1){
                       $el.addClass("disabled");
                   }
                } else {
                    $el.siblings(".qty-minus").removeClass("disabled");
                    $qtyField.val(parseInt($qtyField.val(), 10) + 1);
                }
            }
        },
        checkQuantity: function(e){
            var $el = $(e.currentTarget);
            $('#account-messages').parent().hide();
            $el.val(parseInt($el.val(), 10));
            if($el.val() === "" || $el.val() <= 1 || $el.val() == "NaN"){
                $('.mz-messagebar').addClass('mz-errors');
                $('.mz-messagebar').text('Quantity cannot be null or empty');
                $('.mz-messagebar').parent().parent().show();
                $el.val(1);
                $el.siblings(".qty-minus").addClass("disabled");
            }
        },
        sanitizeInput: function (e) {
            var value = String.fromCharCode(e.keyCode);

            value = value.replace(/\D+/, '');

            if (value === '') {
                e.preventDefault();
            }
        },
        render: function(){
            var cdn = HyprLiveContext.locals.siteContext.cdnPrefix +"/cms/files/";
            $(this.model.attributes.items.models).each(function(index, order){
                $(order.attributes.items.models).each(function(i, item){
                    var imageMapping = _.find(item.attributes.product.attributes.properties, function(property){
                        return property.attributeFQN.toLowerCase() == "tenant~color-mapping";
                    });
                    if(imageMapping && !item.get("isImgMapped") && imageMapping.values[0].value){

                        var color = _.find(item.attributes.product.attributes.options.models, function(option){
                            return option.attributes.attributeFQN.toLowerCase() == "tenant~color";
                        });

                        $.get(cdn + item.attributes.product.attributes.productCode +"_"+ color.attributes.value + "_1.jpg").then(function(){
                            item.attributes.product.attributes.imageUrl = cdn + item.attributes.product.attributes.productCode +"_"+ color.attributes.value + "_1.jpg";
                            item.set("isImgMapped", cdn + item.attributes.product.attributes.productCode +"_"+ color.attributes.value + "_1.jpg");
                            Backbone.MozuView.prototype.render.call(this);
                        }.bind(this), function(){
                            item.set("isImgMapped", item.attributes.product.get("imageUrl"));
                        });
                    } else if(item.get("isImgMapped") && item.get("isImgMapped") !== true){
                        item.attributes.product.set("imageUrl", item.get("isImgMapped"));
                    }
                }.bind(this));
            }.bind(this));
            Backbone.MozuView.prototype.render.call(this);
        },
        addItemToCart: function(e){
            $('#account-messages').parent().hide();
            var $el = $(e.currentTarget),
                prodCode = $el.data("mz-item-id"),
                me = this;
            api.get("product", prodCode).then(function(prod){

                /* do not add if not purchasable */
                if (prod.data.purchasableState.isPurchasable !== true) {
                    $('.mz-messagebar').addClass('mz-errors');
                    $('.mz-messagebar').text('This item has limited quantity or is out of stock');
                    $('.mz-messagebar').parent().parent().show();
                } else {
                    var variationCode = $el.data("mz-item-variation");
                    var product = new ProductModels.Product(prod.data);
                    var qty = $el.parent().siblings(".qty-field").children('[data-mz-value="quantity"]').val();
                    if(variationCode){
                        var variation = _.find(product.get("variations"), function(variations){
                            return variations.productCode == variationCode;
                        });
                        $(variation.options).each(function(){
                            var varOpt = this;
                            var option = _.find(product.get('options').models, function(option){
                                return option.id == varOpt.attributeFQN; 
                            });

                            option.set("value", varOpt.value);
                        });

                        product.set("quantity", qty);
                        product.updateConfiguration();
                        product.on("change", function(resp){
                            resp.addToCart();
                            resp.on('addedtocart', function (cartitem) {
                                window.SoftCartInstance.update().then(function(){
                                    window.SoftCartInstance.view.render();
                                    window.SoftCartInstance.view.show();
                                    CartMonitor.setCount(window.SoftCartInstance.view.model.count());
                                });
                            });
                            resp.on("error", function(err){
                                if(err.errorCode == "VALIDATION_CONFLICT" && this.attributes.inventoryInfo.manageStock && this.attributes.inventoryInfo.onlineStockAvailable < this.attributes.quantity){
                                    err.message = "Validation Error: We're sorry, we only have "+ this.attributes.inventoryInfo.onlineStockAvailable +" available. Those items have been added to your cart.";
                                    this.set("quantity", this.attributes.inventoryInfo.onlineStockAvailable);
                                    if (!this.validate()) {
                                        this.addToCart();
                                    }
                                }
                                $('#account-messages').each(function(){
                                    $(this).find(".mz-messagebar").text(err.message.substr(18));
                                    $(this).parent().show();
                                });
                            });
                        }.bind(this));
                    } else {
                        product.set("quantity", qty);
                        product.addToCart();
                        product.on('addedtocart', function (cartitem) {
                            window.SoftCartInstance.update().then(function(){
                                window.SoftCartInstance.view.render();
                                window.SoftCartInstance.view.show();
                                CartMonitor.setCount(window.SoftCartInstance.view.model.count());
                            });
                        });
                        product.on("error", function(err){
                                if(err.errorCode == "VALIDATION_CONFLICT" && this.attributes.inventoryInfo.manageStock && this.attributes.inventoryInfo.onlineStockAvailable < this.attributes.quantity){
                                    err.message = "Validation Error: We're sorry, we only have "+ this.attributes.inventoryInfo.onlineStockAvailable +" available. Those items have been added to your cart.";
                                    this.set("quantity", this.attributes.inventoryInfo.onlineStockAvailable);
                                    if (!this.validate()) {
                                        this.addToCart();
                                    }
                                }
                                $('#account-messages').each(function(){
                                    $(this).find(".mz-messagebar").addClass('mz-errors').text(err.message.substr(18));
                                    $(this).parent().show();
                                });
                            });
                    }
                }
            }.bind(this));
        }
    });
    var OrderHistoryView = Backbone.MozuView.extend({
        templateName: "modules/my-account/order-history-list",
        autoUpdate: [
            'rma.returnType',
            'rma.reason',
            'rma.quantity',
            'rma.comments'
        ],
        initialize: function () {
            this.listenTo(this.model, "change:pageSize", _.bind(this.model.changePageSize, this.model));
        },
        render: function(){
            var cdn = HyprLiveContext.locals.siteContext.cdnPrefix +"/cms/files/";
            $(this.model.attributes.items.models).each(function(index, order){
                $(order.attributes.items.models).each(function(i, item){
                    var imageMapping = _.find(item.attributes.product.attributes.properties, function(property){
                        return property.attributeFQN.toLowerCase() == "tenant~color-mapping";
                    });
                    if(imageMapping && !item.get("isImgMapped") && imageMapping.values[0].value){
                        item.set("isImgMapped", true);

                        var color = _.find(item.attributes.product.attributes.options.models, function(option){
                            return option.attributes.attributeFQN.toLowerCase() == "tenant~color";
                        });

                        $.get(cdn + item.attributes.product.attributes.productCode +"_"+ color.attributes.value + "_1.jpg").then(function(){
                            item.attributes.product.attributes.imageUrl = cdn + item.attributes.product.attributes.productCode +"_"+ color.attributes.value + "_1.jpg";
                            item.set("isImgMapped", cdn + item.attributes.product.attributes.productCode +"_"+ color.attributes.value + "_1.jpg");
                            Backbone.MozuView.prototype.render.call(this);
                        }.bind(this), function(){
                            item.set("isImgMapped", item.attributes.product.get("imageUrl"));
                        });
                    } else if(item.get("isImgMapped") && item.get("isImgMapped") !== true){
                        item.attributes.product.set("imageUrl", item.get("isImgMapped"));
                    }
                }.bind(this));
            }.bind(this));
            Backbone.MozuView.prototype.render.call(this);
        },
        getRenderContext: function () {
            var context = Backbone.MozuView.prototype.getRenderContext.apply(this, arguments);
            context.returning = this.returning;
            return context;
        },
        startReturnItem: function (e) {
            var $target = $(e.currentTarget),
                itemId = $target.data('mzStartReturn'),
                orderId = $target.data('mzOrderId');
            if (itemId && orderId) {
                this.returning = itemId;
                this.model.startReturn(orderId, itemId);
            }
            this.render();
        },
        cancelReturnItem: function () {
            delete this.returning;
            this.model.clearReturn();
            this.render();
        },
        finishReturnItem: function () {
            var self = this,
                op = this.model.finishReturn();
            if (op) {
                return op.then(function () {
                    delete self.returning;
                    self.render();
                });
            }
        }
    }),

    ReturnHistoryView = Backbone.MozuView.extend({
        templateName: "modules/my-account/return-history-list",
        initialize: function () {
            var self = this;
            this.listenTo(this.model, "change:pageSize", _.bind(this.model.changePageSize, this.model));
            this.listenTo(this.model, 'returndisplayed', function (id) {
                var $retView = self.$('[data-mz-id="' + id + '"]');
                if ($retView.length === 0) $retView = self.$el;
                $retView.ScrollTo({ axis: 'y' });
            });
        }
    });

    //var scrollBackUp = _.debounce(function () {
    //    $('#orderhistory').ScrollTo({ axis: 'y', offsetTop: Hypr.getThemeSetting('gutterWidth') });
    //}, 100);
    //var OrderHistoryPageNumbers = PagingViews.PageNumbers.extend({
    //    previous: function () {
    //        var op = PagingViews.PageNumbers.prototype.previous.apply(this, arguments);
    //        if (op) op.then(scrollBackUp);
    //    },
    //    next: function () {
    //        var op = PagingViews.PageNumbers.prototype.next.apply(this, arguments);
    //        if (op) op.then(scrollBackUp);
    //    },
    //    page: function () {
    //        var op = PagingViews.PageNumbers.prototype.page.apply(this, arguments);
    //        if (op) op.then(scrollBackUp);
    //    }
    //});

    var PaymentMethodsView = EditableView.extend({
        templateName: "modules/my-account/my-account-paymentmethods",
        autoUpdate: [
            'editingCard.isDefaultPayMethod',
            'editingCard.paymentOrCardType',
            'editingCard.nameOnCard',
            'editingCard.cardNumberPartOrMask',
            'editingCard.expireMonth',
            'editingCard.expireYear',
            'editingCard.cvv',
            'editingCard.isCvvOptional',
            'editingCard.contactId',
            'editingContact.firstName',
            'editingContact.lastNameOrSurname',
            'editingContact.address.address1',
            'editingContact.address.address2',
            'editingContact.address.address3',
            'editingContact.address.cityOrTown',
            'editingContact.address.countryCode',
            'editingContact.address.stateOrProvince',
            'editingContact.address.postalOrZipCode',
            'editingContact.address.addressType',
            'editingContact.phoneNumbers.home',
            'editingContact.isBillingContact',
            'editingContact.isPrimaryBillingContact',
            'editingContact.isShippingContact',
            'editingContact.isPrimaryShippingContact'
        ],
        renderOnChange: [
            'editingCard.isDefaultPayMethod',
            'editingCard.contactId',
            'editingContact.address.countryCode'
        ],
        beginEditCard: function (e) {
            var id = this.editing.card = e.currentTarget.getAttribute('data-mz-card');
            this.model.beginEditCard(id);
            this.render();
        },
        render: function(){
            Backbone.MozuView.prototype.render.call(this);
            if(this.model.get("editingContact") &&
                this.model.get("editingContact").get("address") &&
                !this.model.get("editingContact").get("address").get("countryCode") &&
                this.$el.find("[data-mz-value='editingContact.address.countryCode']").length > 0){
                    this.$el.find("[data-mz-value='editingContact.address.countryCode']").trigger("change");
            }
        },
        finishEditCard: function() {

            function validate () {
                var cardNumber  = $('input[name="credit-card-number"]'),
                    cardType    = $('select[id="mz-payment-credit-card-type"]'),
                    cardName    = $('input[name="credit-card-name"]'),
                    cardMonth   = $('select[id="mz-payment-expiration-month"]'),
                    cardYear    = $('select[name="mz-payment-expiration-year"]'),
                    addrfName   = $('input[name="firstname"]'),
                    addrlName   = $('input[name="lastname"]'),
                    addrStreet  = $('input[name="address-line-1"]'),
                    addrCity    = $('input[name="city"]'),
                    addrCountry = $('select[data-mz-value="editingContact.address.countryCode"]'),
                    addrState   = $('select[data-mz-value="editingContact.address.stateOrProvince"]'),
                    addrZip     = $('input[name="postal-code"]'),
                    addrPhone   = $('input[name="shippingphone"]');

                var isValid = true;

                if (cardNumber.val() === '') {
                    isValid = false;
                    $(cardNumber).next().html('Please enter your card number');
                } else {
                    $(cardNumber).next().html('');
                }

                if (cardType.val() === '') {
                    isValid = false;
                    $(cardType).next().html('Please select your card type');
                } else {
                    $(cardType).next().html('');
                }

                if (cardName.val() === '') {
                    isValid = false;
                    $(cardName).next().html('Please enter the name printed on your card');
                } else {
                    $(cardName).next().html('');
                }

                if (cardMonth.val() === 'Month' || cardYear.val() === 'Year' || typeof cardMonth.val() === 'undefined' || typeof cardYear.val() === 'undefined') {
                    isValid = false;
                    $('[data-mz-validationmessage-for="editingCard.expireYear"]').html('Please enter an expiration date in the future');
                } else {
                    var d = new Date();
                    var month = d.getMonth();
                    var year = d.getFullYear();

                    if (year > parseInt(cardYear.val(), 10) || ((month + 1) > parseInt(cardMonth.val(), 10) && year >= parseInt(cardYear.val(), 10))) {
                        isValid = false;
                        $('[data-mz-validationmessage-for="editingCard.expireYear"]').html('Please enter an expiration date in the future');
                    } else {
                        $('[data-mz-validationmessage-for="editingCard.expireYear"]').html('');
                    }
                }

                if (addrfName.val() === '') {
                    isValid = false;
                    $(addrfName).next().html('First name required');
                } else {
                    $(addrfName).next().html('');
                }

                if (addrlName.val() === '') {
                    isValid = false;
                    $(addrlName).next().html('Last name required');
                } else {
                    $(addrlName).next().html('');
                }

                if (addrStreet.val() === '') {
                    isValid = false;
                    $(addrStreet).next().html('Street address required');
                } else {
                    $(addrStreet).next().html('');
                }

                if (addrCity.val() === '') {
                    isValid = false;
                    $(addrCity).next().html('City or town required');
                } else {
                    $(addrCity).next().html('');
                }

                if (addrCountry.val() === '') {
                    isValid = false;
                    $(addrCountry).next().html('Country required');
                } else {
                    $(addrCountry).next().html('');
                }

                if (addrState.val() === '' && addrCountry.val() === 'US') {
                    isValid = false;
                    $(addrState).next().html('State or province required');
                } else {
                    $(addrState).next().html('');
                }

                if (addrZip.val() === '' && addrCountry.val() === 'US') {
                    isValid = false;
                    $(addrZip).next().html('Postal code required');
                } else {
                    $(addrZip).next().html('');
                }

                if (addrPhone.val() === '') {
                    isValid = false;
                    $(addrPhone).next().html('Phone number required');
                } else {
                    $(addrPhone).next().html('');
                }

                return isValid;
            }

            var self = this;
            if (validate()) {
                var operation = this.doModelAction('saveCard');
                if (operation) {
                    operation.otherwise(function() {
                        self.editing.card = true;
                    });
                    this.editing.card = false;
                }
            }
        },
        cancelEditCard: function () {
            this.editing.card = false;
            this.model.endEditCard();
            this.render();
        },
        beginDeleteCard: function (e) {
            var self = this,
                id = e.currentTarget.getAttribute('data-mz-card'),
                card = this.model.get('cards').get(id);
            if (window.confirm(Hypr.getLabel('confirmDeleteCard', card.get('cardNumberPart')))) {
                this.doModelAction('deleteCard', id);
            }
        }
    });

    var AddressBookView = EditableView.extend({
        templateName: "modules/my-account/my-account-addressbook",
        autoUpdate: [
            'editingContact.firstName',
            'editingContact.lastNameOrSurname',
            'editingContact.address.address1',
            'editingContact.address.address2',
            'editingContact.address.address3',
            'editingContact.address.cityOrTown',
            'editingContact.address.countryCode',
            'editingContact.address.stateOrProvince',
            'editingContact.address.postalOrZipCode',
            'editingContact.address.addressType',
            'editingContact.phoneNumbers.home',
            'editingContact.isBillingContact',
            'editingContact.isPrimaryBillingContact',
            'editingContact.isShippingContact',
            'editingContact.isPrimaryShippingContact'
            ],
        renderOnChange: [
            'editingContact.address.countryCode',
            'editingContact.isBillingContact',
            'editingContact.isShippingContact'
        ],
        beginAddContact: function () {
            this.editing.contact = "new";
            this.render();
        },
        beginEditContact: function (e) {
            var id = this.editing.contact = e.currentTarget.getAttribute('data-mz-contact');
            this.model.beginEditContact(id);
            this.render();
        },
        finishEditContact: function () {
            var self = this,
                isAddressValidationEnabled = HyprLiveContext.locals.siteContext.generalSettings.isAddressValidationEnabled;
            var operation = this.doModelAction('saveContact', { forceIsValid: isAddressValidationEnabled }); // hack in advance of doing real validation in the myaccount page, tells the model to add isValidated: true
            if (operation) {
                operation.otherwise(function() {
                    self.editing.contact = true;
                });
                this.editing.contact = false;
            }
        },
        cancelEditContact: function () {
            this.editing.contact = false;
            this.model.endEditContact();
            this.render();
        },
        beginDeleteContact: function (e) {
            var self = this,
                contact = this.model.get('contacts').get(e.currentTarget.getAttribute('data-mz-contact')),
                associatedCards = this.model.get('cards').where({ contactId: contact.id }),
                windowMessage = Hypr.getLabel('confirmDeleteContact', contact.get('address').get('address1')),
                doDeleteContact = function() {
                    return self.doModelAction('deleteContact', contact.id);
                },
                go = doDeleteContact;


            if (associatedCards.length > 0) {
                windowMessage += ' ' + Hypr.getLabel('confirmDeleteContact2');
                go = function() {
                    return self.doModelAction('deleteMultipleCards', _.pluck(associatedCards, 'id')).then(doDeleteContact);
                };
               
            }

            if (window.confirm(windowMessage)) {
                return go();
            }
        }
    });

    var StoreCreditView = Backbone.MozuView.extend({
        templateName: 'modules/my-account/my-account-storecredit',
        addStoreCredit: function (e) {
            var self = this;
            var id = this.$('[data-mz-entering-credit]').val();
            this.model.addStoreCredit(id).then(function(){
                self.model.getStoreCredits().then(function(){
                    var totalCredit = 0;
                    this.model.attributes.credits.models.forEach(function(credit){
                        totalCredit += parseFloat(credit.attributes.currentBalance);
                    });
                    this.model.set("totalCreditAmount", totalCredit);
                    this.render();
                }.bind(self));
            }, _.bind(function (xhr) {
                document.getElementById('storecredit-error').innerHTML = xhr.message;
            }, this));
        }
    });

    $(document).ready(function () {

        var accountModel = window.accountModel = CustomerModels.EditableCustomer.fromCurrent();

        var $accountSettingsEl = $('#my-account-info'),
            $passwordEl = $('#password-section'),
            $quickOrder = $("#mz-quick-order"),
            $orderHistoryEl = $('[data-mz-content="order-history"]'),
            $returnHistoryEl = $('#account-returnhistory'),
            $paymentMethodsEl = $('#mz-account-paymentmethods'),
            $addressBookEl = $('#mz-account-addressbook'),
            $wishListEl = $('#account-wishlist'),
            $messagesEl = $('#account-messages'),
            $storeCreditEl = $('[data-mz-content="store-credit"]'),
            orderHistory = accountModel.get('orderHistory'),
            returnHistory = accountModel.get('returnHistory'),
            cdn = HyprLiveContext.locals.siteContext.cdnPrefix +"/cms/files/";

            $(orderHistory.attributes.items.models).each(function(index, order){
                $(order.attributes.items.models).each(function(i, item){
                    var imageMapping = _.find(item.attributes.product.attributes.properties, function(property){
                        return property.attributeFQN.toLowerCase() == "tenant~color-mapping";
                    });
                    if(imageMapping && !item.get("isImgMapped") && imageMapping.values[0].value){
                        item.set("isImgMapped", true);
                    }
                });
            });
        var accountViews = window.accountViews = {
            settings: new AccountSettingsView({
                el: $accountSettingsEl,
                model: accountModel,
                messagesEl: $messagesEl
            }),
            password: new PasswordView({
                el: $passwordEl,
                model: accountModel,
                messagesEl: $messagesEl
            }),
            quickOrder: new QuickOrderView({
                el: $quickOrder.find('[data-mz-quickOrder-list]'),
                model: orderHistory,
                messageEl: $messagesEl
            }),
            orderHistory: new OrderHistoryView({
                el: $orderHistoryEl.find('[data-mz-orderlist]'),
                model: orderHistory
            }),
            orderHistoryPagingControls: new PagingViews.PagingControls({
                templateName: 'modules/my-account/order-history-paging-controls',
                el: $orderHistoryEl.find('[data-mz-pagingcontrols]'),
                model: orderHistory
            }),
            orderHistoryPageNumbers: new PagingViews.PageNumbers({
                el: $orderHistoryEl.find('[data-mz-pagenumbers]'),
                model: orderHistory
            }),
            returnHistory: new ReturnHistoryView({
                el: $returnHistoryEl.find('[data-mz-orderlist]'),
                model: returnHistory
            }),
            returnHistoryPagingControls: new PagingViews.PagingControls({
                templateName: 'modules/my-account/order-history-paging-controls',
                el: $returnHistoryEl.find('[data-mz-pagingcontrols]'),
                model: returnHistory
            }),
            returnHistoryPageNumbers: new PagingViews.PageNumbers({
                el: $returnHistoryEl.find('[data-mz-pagenumbers]'),
                model: returnHistory
            }),
            paymentMethods: new PaymentMethodsView({
                el: $paymentMethodsEl,
                model: accountModel,
                messagesEl: $messagesEl
            }),
            addressBook: new AddressBookView({
                el: $addressBookEl,
                model: accountModel,
                messagesEl: $messagesEl
            }),
            storeCredit: new StoreCreditView({
                el: $storeCreditEl,
                model: accountModel,
                messagesEl: $messagesEl
            })
        };

        orderHistory.sortBy("submittedDate desc");
        
        if (HyprLiveContext.locals.siteContext.generalSettings.isWishlistCreationEnabled) accountViews.wishList = new WishListView({
            el: $wishListEl,
            model: accountModel.get('wishlist'),
            messagesEl: $messagesEl
        });

        /* select Primary checkbox if default address is checked */
        $('[data-mz-value="editingContact.isPrimaryShippingContact"]').on('change', function () {
            $('[data-mz-value="editingContact.isShippingContact"]').trigger('click');
        });

        /* Needs integrated into backbone. Functions in console, but not file. */
        $('.mz-tracking-number').each(function(){
            var trackingCarrier = $(this).children('.mz-tracking-carrier').text().toLowerCase();
            var trackingNumber = $(this).children('.mz-tracking-link').text();
            var trackingLink = $(this).children('.mz-tracking-link');
            if(trackingCarrier.indexOf("ups") >= 0) {
                trackingLink.attr("href", "https://wwwapps.ups.com/WebTracking/track?track=yes&trackNums=" + trackingNumber).text('NEW TRACKING LINK');
            } else if(trackingCarrier.indexOf("fedex") >= 0) {
                trackingLink.attr("href", "http://www.fedex.com/Tracking?action=track&tracknumbers=" + trackingNumber).text('NEW TRACKING LINK');
            } else if(trackingCarrier.indexOf("usps") >= 0) {
                trackingLink.attr("href", "https://tools.usps.com/go/TrackConfirmAction_input?qtc_tLabels1=" + trackingNumber).text('NEW TRACKING LINK');
            }
        });

        /* control modified select */
        // $('#mz-month-select').on('click', function (e) {
        //     $(this).closest('.mz-modified-dropdown-list').show();
        // });
        // $('.mz-modified-dropdown-list > li').on('click', function (e) {
        //     $(this).parent().hide();
        // });
        // $('input[name="month"]').on('change', function (e) {
        //     $(this).parent().parent().prev().html($('.mz-modified-radio:checked').val());
        // });

        /* Control myAccount nav-->section correlation */
        $('.mz-my-account-link').on('click', function (e) {
            $('.mz-my-account-link').removeClass('mz-active');
            $(this).addClass('mz-active');
            $('.my-account-section').hide();
            $('[data-mz-content="' + $(e.currentTarget).data().mzAccount + '"]').show();
            $('#account-messages').parent().hide();
            window.location.href = $(this).attr("href");
        });

        /* control myAccount url --> section correlation */
        var hash = window.location.hash;
        if (hash !== '') {
            $('.my-account-section').hide();
            $('[data-mz-content="' + hash.replace('#', '') + '"]').show();
        } else {
            $('#personal-information').show();
        }

        $(window).on('hashchange', function (e) {
            $('.my-account-section').hide();
            $('[data-mz-content="' + window.location.hash.replace('#', '') + '"]').show();
        });

        /* control order history */
        $('table.order').on('click', function (e) {
            if ($(this).hasClass('active')) {
                $(this).removeClass('active');
                $(this).children('tbody').hide();
                $(this).find('indicator').html('+');
            } else {
                $(this).addClass('active');
                $(this).children('tbody').show();
                $(this).find('.indicator').html('&minus;');
            }
        });

        /* select countrycode by default */
        var addrCountry = $('[data-mz-value="editingContact.address.countryCode"]');
        if (typeof addrCountry.val() === 'undefined') {
            addrCountry.val('US');
        }

        // TODO: upgrade server-side models enough that there's no delta between server output and this render,
        // thus making an up-front render unnecessary.
        _.invoke(window.accountViews, 'render');

    });
});