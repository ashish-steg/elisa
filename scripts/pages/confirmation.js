/* globals V: true */
define([
    'modules/jquery-mozu',
    'underscore',
    'hyprlive',
    'modules/backbone-mozu',
    'hyprlivecontext'
], function (
    $,
    _,
    Hypr,
    Backbone,
    HyprLiveContext
) {
    var ConfirmationView = Backbone.MozuView.extend({
        templateName: "modules/common/order-summary",
        initialize: function () {
            
        }
    });

    $(document).ready(function() {
        var confirmationModel = Backbone.MozuModel.extend(),
            confirmationView = new ConfirmationView({
                            el: $('.mz-confirmation-order-summary-wrapper'),
                            model: new confirmationModel(require.mozuData("order"))
                        });
        
        var cdn = HyprLiveContext.locals.siteContext.cdnPrefix +"/cms/files/";
        $(confirmationView.model.attributes.items).each(function(index, item){
            var imageMapping = _.find(item.product.properties, function(property){
                return property.attributeFQN.toLowerCase() == "tenant~color-mapping";
            });
            if(imageMapping && !item.isImgMapped && imageMapping.values[0].value){

                item.isImgMapped = true;
                var color = _.find(item.product.options, function(option){
                    return option.attributeFQN.toLowerCase() == "tenant~color";
                });

                $.get(cdn + item.product.productCode +"_"+ color.value + "_1.jpg").then(function(){
                    item.product.imageUrl = cdn + item.product.productCode +"_"+ color.value + "_1.jpg";
                    confirmationView.render();
                }.bind(confirmationView));
            }
        }.bind(confirmationView));

        confirmationView.render();
    });

});
