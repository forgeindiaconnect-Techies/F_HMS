export const getFoodImage = (itemOrName, customImage) => {
    if (customImage && typeof customImage === 'string' && customImage.trim()) {
        return customImage.trim();
    }
    if (typeof itemOrName === 'object' && itemOrName !== null) {
        if (itemOrName.image && typeof itemOrName.image === 'string' && itemOrName.image.trim()) {
            return itemOrName.image.trim();
        }
    }
    if (typeof itemOrName === 'string' && (itemOrName.startsWith('http') || itemOrName.startsWith('/') || itemOrName.startsWith('data:'))) {
        return itemOrName;
    }
    return '';
};

export const getItemImage = (item) => {
    if (item && typeof item === 'object') {
        if (item.image && typeof item.image === 'string' && item.image.trim()) {
            return item.image.trim();
        }
    }
    if (typeof item === 'string' && (item.startsWith('http') || item.startsWith('/') || item.startsWith('data:'))) {
        return item;
    }
    return '';
};

export const getFallbackFoodImage = (itemOrName) => {
    return getItemImage(itemOrName);
};
