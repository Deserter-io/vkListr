# vkListr – списки аккаунтов ВКонтакте

vkListr позволяет скачать список Участников группы/сообщества/паблика ВКонтакте.

## Зачем?

Проект затевался как эксперимент с web worker'ом для долгоиграющей задачи. И хотелось сделать что-то OpenSource'ное. Буду рад, если к проекту присоединятся талантливые разработчики.

## Ценные моменты

* инструмент работает целиком в браузере, не требуется серверной части;
* запросы к API ВКонтакте учитывают их ограничение «не более трёх запросов в 1 секунду»;
* за один запрос получаем *почти* 25000 аккаунтов. Группа /live с их 3.5млн Участников скачивается за 85 секунд;
* учитывается вероятность *изменения* списка Участников во время скачивания: пачки по 1000 аккаунтов скачиваются внахлёст и совмещаются. Это позволяет избежать ситуации, когда, напр., скачан первый миллион, и тут 2 аккаунта, покинувшие группу в этот момент (из 1-го млн.), сдвигают все последующие на 2 влево – так несколько валидных аккаунтов могут выпасть из скачивания. Ситуация часто происходит с крупными группами. #todo сделать тест на такую ситуацию.
* код процедур на языке [VKScript](https://vk.com/dev/execute) хранится в отдельных файлах, которые удобно редактировать.
* прогнозируется время окончания длительного скачивания на основании завершенных итераций;
* комментарии кода на английском языке – мне так удобнее.

## Установка

Скачать / клонировать репо в папку на веб сервере. Открыть папку или `index.html` на сайте в браузере. Прямо из локальной папки не заработет – попробуйте дописать протокол `http://` скриптам и стилям залинкованным из `index.html`.

Кроме того, понадобится приложение ВКонтакте типа «сайт». [Создайте собственное приложение](https://vk.com/editapp?act=create), и впишите его ID вместо предустановленного – в конце файла `index.html` см. строку `App.init({appId: 5092064 });` – вот это число и замените на ID вашего собственного приложения ВКонтакте. Но вообще должно работать и с этим.

Собственное приложение ВК позволит вам перенести код VKScript'ов в Хранимые процедуры в настройках вашего приложения. Слегка изменив код, вы так сможете чуть ускорить сбор данных.

## Планы / TODO

* улучшить интерфейс;
* скачивать также списки Друзей и Подписчиков персон;
* скачивать расширенную информацию об аккаунтах, помимо их id: город, пол, возраст, имя;
* формировать пул из нескольких токенов, перелогиниваясь ВКонтакте, и сохранять его в браузере – для более быстрой работы параллельными воркерами.

## Автор

Сергей Соколов
[github](https://github.com/sergiks), [ВКонтакте](https://vk.com/serge.sokolov), hello @ sergeisokolov . com
Москва, 2015.