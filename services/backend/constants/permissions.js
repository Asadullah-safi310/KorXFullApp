const PERMISSIONS = {
    TOWER: {
        PARENT_CREATE: 'parent.tower.create',
        PARENT_READ: 'parent.tower.readMine',
        CHILD_CREATE: 'child.tower.create',
    },
    MARKET: {
        PARENT_CREATE: 'parent.market.create',
        PARENT_READ: 'parent.market.readMine',
        CHILD_CREATE: 'child.market.create',
    },
    SHARAK: {
        PARENT_CREATE: 'parent.sharak.create',
        PARENT_READ: 'parent.sharak.readMine',
        CHILD_CREATE: 'child.sharak.create',
    },
    NORMAL: {
        CREATE: 'property.normal.create',
    }
};

module.exports = PERMISSIONS;
