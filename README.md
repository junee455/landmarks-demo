# landmarks-demo

### Билд и запуск
устанавливаем пакеты и запускаем, откроется на порте 8080

    yarn install
    yarn start
    
билдится в ./dist

    yarn build
### Файлы
**vpsV3.ts**

constructRequestDataEmbed - создает форму для отправки запроса с данными в бинарном формате  
constructRequestDataImg - создает форму для отправки запроса с картинкой  
sendToVps - отсылает заранее созданную форму. Пока система координат клиента - arcore  
environments - объект со ссылками на stage и prod naviar.o  

**slamInterface.ts** - файл с ключевыми функциями для взаимодействия с нативным трекингом
getSlam - возвращает объект описывающий текущую позицию и вращение камеры  
getEmbed - взвращает объект с вектором фичей от mobileVps и позицией камеры в момент начала обработки изображения  
getIntrinsics - возвращает интринзики камеры  

**helpers.ts** - функции для преобразования трансформаций. В данный момент не используется, так как система координат arcore почти полностью совпадает с системой координат three.js. Для получения адекватной картинки окклюдер нужно повернуть на 90 градусов, углы и координаты камеры от vps можно скопировать напрямую. Последовательность углов Эйлера - XYZ.

