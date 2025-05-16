// src/utils/imageUtils.js

/**
 * Nén ảnh từ chuỗi base64 để giảm kích thước trước khi upload
 * @param {string} base64Image - Chuỗi base64 của ảnh
 * @param {number} maxWidth - Chiều rộng tối đa sau khi nén
 * @param {number} maxHeight - Chiều cao tối đa sau khi nén
 * @param {number} quality - Chất lượng ảnh (0-1)
 * @returns {Promise<string>} - Chuỗi base64 đã được nén
 */
export const compressImage = (base64Image, maxWidth = 800, maxHeight = 800, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    try {
      // Tạo một đối tượng Image để lấy kích thước ảnh
      const img = new Image();
      img.src = base64Image;
      
      img.onload = () => {
        // Tính toán kích thước mới giữ nguyên tỷ lệ
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width));
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = Math.round(width * (maxHeight / height));
          height = maxHeight;
        }
        
        // Tạo canvas để vẽ ảnh với kích thước mới
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        // Vẽ ảnh lên canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Chuyển đổi canvas thành chuỗi base64 với chất lượng được chỉ định
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        
        // So sánh kích thước trước và sau khi nén
        console.log('Original size:', Math.round(base64Image.length / 1024), 'KB');
        console.log('Compressed size:', Math.round(compressedBase64.length / 1024), 'KB');
        
        resolve(compressedBase64);
      };
      
      img.onerror = (error) => {
        reject(new Error('Failed to load image for compression'));
      };
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Nén file ảnh trước khi upload
 * @param {File} file - File ảnh
 * @param {number} maxWidth - Chiều rộng tối đa sau khi nén
 * @param {number} maxHeight - Chiều cao tối đa sau khi nén
 * @param {number} quality - Chất lượng ảnh (0-1)
 * @returns {Promise<File>} - File ảnh đã được nén
 */
export const compressImageFile = (file, maxWidth = 800, maxHeight = 800, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    try {
      // Kiểm tra xem file có phải là ảnh không
      if (!file.type.match(/image.*/)) {
        return resolve(file); // Trả về file gốc nếu không phải ảnh
      }
      
      // Đọc file thành URL
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
          // Tính toán kích thước mới giữ nguyên tỷ lệ
          let width = img.width;
          let height = img.height;
          
          // Chỉ nén nếu ảnh lớn hơn kích thước tối đa
          if (width <= maxWidth && height <= maxHeight && file.size <= 1024 * 1024) {
            return resolve(file); // Không cần nén
          }
          
          if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width));
            width = maxWidth;
          }
          
          if (height > maxHeight) {
            width = Math.round(width * (maxHeight / height));
            height = maxHeight;
          }
          
          // Tạo canvas để vẽ ảnh với kích thước mới
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          // Vẽ ảnh lên canvas
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Chuyển đổi canvas thành blob
          canvas.toBlob((blob) => {
            // Tạo file mới từ blob
            const newFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            
            // So sánh kích thước trước và sau khi nén
            console.log('Original size:', Math.round(file.size / 1024), 'KB');
            console.log('Compressed size:', Math.round(newFile.size / 1024), 'KB');
            
            resolve(newFile);
          }, 'image/jpeg', quality);
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image for compression'));
        };
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
    } catch (error) {
      reject(error);
    }
  });
};
