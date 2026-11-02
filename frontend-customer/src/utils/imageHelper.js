export const getFallbackFoodImage = () => {
    return null;
};

export const getItemImage = (item) => {
    if (!item) return null;
    
    const imgUrl = item.image || item.img || item.imageUrl || '';
    if (imgUrl && (imgUrl.startsWith('http://') || imgUrl.startsWith('https://') || imgUrl.startsWith('/') || imgUrl.startsWith('data:image'))) {
        if (!imgUrl.includes('.html') && !imgUrl.includes('/recipe-') && !imgUrl.includes('unsplash.com')) {
            return imgUrl;
        }
    }
    
    return null;
};
