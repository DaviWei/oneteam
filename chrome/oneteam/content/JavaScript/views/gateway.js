function GatewaysMenuView(menuItem)
{
    this.containerNode = menuItem.firstChild;
    this.menuItem = menuItem;
    this.items = [];
    this.model = account;

    this.onModelUpdated(null, "gateways", {added: [gateway for each (gateway in account.gateways)]});
    this.model.registerView(this.onModelUpdated, this, "gateways");
}

_DECL_(GatewaysMenuView, null, ContainerView).prototype =
{
    afterlastItemNode: null,
    containerNode: null,

    itemComparator: function(a, b)
    {
        a = a.model.gatewayName.toLowerCase();
        b = b.model.gatewayName.toLowerCase();

        return a == b ? 0 : a > b ? 1 : -1;
    },

    onModelUpdated: function(model, type, data)
    {
        for (var i = 0; data.added && i < data.added.length; i++) {
            var node = document.createElement("menuitem");

            node.setAttribute("class", "gateway-view");
            node.setAttribute("oncommand", "this.model.onRegister()");
            node.setAttribute("label", data.added[i].gatewayName+" ("+
                              data.added[i].jid.domain+")");

            node.model = data.added[i];

            this.onItemAdded(node);
        }

        for (i = 0; data.removed && i < data.removed.length; i++)
            this.onItemRemoved(data.removed[i]);

        this.menuItem.hidden = account.gateways.__count__ == 0;
    }
}

function GatewaysToolbarButtons(gatewaysSeparator)
{
    this.gatewaysSeparator = gatewaysSeparator;
    this.containerNode = gatewaysSeparator.parentNode;
    this.afterlastItemNode = gatewaysSeparator.nextSibling;
    this.items = [];
    this._visibleItems = [];
    this.model = account;

    this.onModelUpdated(null, "gateways", {added: [gateway for each (gateway in account.gateways)]});
    this.model.registerView(this.onModelUpdated, this, "gateways");
}

_DECL_(GatewaysToolbarButtons, null, ContainerView).prototype =
{
    afterlastItemNode: null,
    containerNode: null,

    itemComparator: function(a, b)
    {
        a = a.model.gatewayName.toLowerCase();
        b = b.model.gatewayName.toLowerCase();

        return a == b ? 0 : a > b ? 1 : -1;
    },

    onModelUpdated: function(model, type, data)
    {
        for (var i = 0; data.added && i < data.added.length; i++)
            this.onItemAdded(new GatewayToolbarButton(data.added[i], this));

        for (i = 0; data.removed && i < data.removed.length; i++)
            this.onItemRemoved(data.removed[i]);
    },

    _updateVisibleItems: function(item, visible)
    {
        var idx = this._visibleItems.indexOf(item);
        if (visible) {
            if (idx < 0)
                this._visibleItems.push(item);
        } else if (idx >= 0)
            this._visibleItems.splice(idx);

        this.gatewaysSeparator.hidden = this._visibleItems.length == 0;
    }
}

function GatewayToolbarButton(model, parentView)
{
    this.model = model;
    this.parentView = parentView;

    this.node = document.createElement("toolbarbutton");
    this.node.setAttribute("class", "gateway-toolbarbutton");
    this.node.setAttribute("autoCheck", "false");
    this.node.setAttribute("tooltiptext", model.gatewayName + " ("+model.jid+")");
    this.node.setAttribute("oncommand", "this.checked ? this.model.logout() : this.model.login()")
    this.node.setAttribute("context", "gateway-contextmenu");
    this.node.setAttribute("onmousedown", "this._contextMenu.model = this.model");
    this.node.setAttribute("gateway-type", model.gatewayType);

    this.node.model = this.model;
    this.node.view = this;
    this.node._contextMenu = document.getElementById('gateway-contextmenu');

    this._bundle = new RegsBundle(this);
    this._bundle.register(this.model, this.onPresenceUpdated, "presence");
    this._bundle.register(this.model, this.onNewItemChange, "newItem");

    this.onNewItemChange();
}

_DECL_(GatewayToolbarButton).prototype =
{
    onPresenceUpdated: function()
    {
        this.node.setAttribute("checked", !!this.model.activeResource);
        this.node.checked = !!this.model.activeResource;
    },

    onNewItemChange: function()
    {
        if (!this.model.newItem)
            this.onPresenceUpdated();
        this.node.setAttribute("hidden", !!this.model.newItem);
        this.parentView._updateVisibleItems(this, !this.model.newItem);
    },

    show: function(rootNode, insertBefore)
    {
        rootNode.insertBefore(this.node, insertBefore);
    },

    destroy: function()
    {
        if (this.node.parentNode)
            this.node.parentNode.removeChild(this.node);

        this.parentView._updateVisibleItems(this, false);

        this._bundle.unregister();
    }
}