define([
        'modules/jquery-mozu',
        'underscore',
        'modules/backbone-mozu',
        'hyprlivecontext',
        'modules/models-cart',
        'modules/cart-monitor'
    ],
    function($, _, Backbone, HyprLiveContext, CartModels, CartMonitor) {

        var SoftCartView = Backbone.MozuView.extend({
            templateName: "modules/cart/cart-popout",
            goToCart: function() {
                window.location = "/cart";
                return false;
            },
            checkout: function(e){
                if(!require.mozuData("user").isAuthenticated){
                    e.preventDefault();
                    this.goToCart();
                }
            },
            show: function(){
                this.$el.css("display", "flex");
                setTimeout(function(){
                    this.$el.fadeOut(function(){
                        $(this).removeAttr("style");
                    });
                }.bind(this), 2000);
            },
            render: function(e) {
                Backbone.MozuView.prototype.render.apply(this);
            }

        });

        var SoftCartInstance = {
            update: function() {
                return this.model.apiGet();

                // NOT SURE WHAT THIS IS BUT IT NEVER ACTUALLY GETS RUN ANYWAY
                // SINCE IT'S CALLED AFTER THE RETURN...
                // -----
                // CartMonitor.$el = $('[data-mz-role="cartmonitor"]');
                // CartMonitor.update();

                // $('[data-mz-role="cartmonitor"]').promise().done(function(arg1) {
                //     CartMonitor.$el = $('[data-mz-role="cartmonitor"]');
                //     CartMonitor.update();
                // });
            }
        };

        var isMouseIn = false;

        $(document).ready(function() {
            SoftCartInstance.model = new CartModels.Cart();

            SoftCartInstance.view = new SoftCartView({
                el: $('.mz-cartmonitor-popout'),
                model: SoftCartInstance.model
            });

            SoftCartInstance.update().then(function(){
                var cdn = HyprLiveContext.locals.siteContext.cdnPrefix +"/cms/files/";
                $(SoftCartInstance.model.attributes.items.models).each(function(){
                    var imageMapping = _.find(this.attributes.product.attributes.properties, function(property){
                        return property.attributeFQN.toLowerCase() == "tenant~color-mapping";
                    });
                    if(imageMapping && imageMapping.values[0].value){
                        this.attributes.product.set("isImgMapped", true);

                        $.get(cdn + this.attributes.data.imgUrl).then(function(){
                            this.attributes.product.attributes.imageUrl = cdn + this.attributes.data.imgUrl;
                            window.SoftCartInstance.view.render();
                        }.bind(this));
                    }
                });  
                SoftCartInstance.view.render(); 
            });

            window.SoftCartInstance = SoftCartInstance;
        });

        return SoftCartInstance;
    });
