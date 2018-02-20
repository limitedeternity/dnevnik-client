# -*- coding: utf-8 -*-

from os import chdir, environ
from os.path import dirname, abspath
from collections import Counter
from datetime import datetime, timedelta
from random import choice
from re import findall, match
from json import loads
from pytz import utc
from flask import Flask, render_template, make_response, request, redirect, jsonify, abort, send_from_directory
from flask_sslify import SSLify # Ensure HTTPS
from flask_compress import Compress # Compression
from flask_cors import CORS # Request origin Control
from whitenoise import WhiteNoise
from requests import Session, codes
from pywebpush import webpush
from redis import Redis
from requests.adapters import HTTPAdapter
from requests.exceptions import ConnectionError
from cachecontrol import CacheControl

debug = False
compress = Compress()
redis_storage = Redis.from_url(environ.get("REDIS_URL"))

app = Flask(__name__, template_folder='templates')
app.wsgi_app = WhiteNoise(app.wsgi_app, root='static/')
app.config['SECRET_KEY'] = environ.get("SECRET_KEY", "".join(choice("abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)") for _ in range(50)))
app.config['COMPRESS_MIMETYPES'] = ['text/html', 'application/json']
app.config['COMPRESS_MIN_SIZE'] = 0

if not debug:
    app.config['REMEMBER_COOKIE_SECURE'] = True
    app.config['SESSION_COOKIE_SECURE'] = True
    sslify = SSLify(app)
    CORS(app, origins="https://dnevnik-client.herokuapp.com")

compress.init_app(app)


'''
Required functionality
'''


def timeDate(typeDate, offset, feed=False):
    time = None

    if not feed:
        if (datetime.now(tz=utc) + timedelta(hours=offset)).weekday() == 6:
            time = datetime.now(tz=utc) + timedelta(hours=offset, days=1)

        elif (datetime.now(tz=utc) + timedelta(hours=offset)).weekday() + 1 == 6:
            if (datetime.now(tz=utc) + timedelta(hours=offset)).hour < 14:
                time = datetime.now(tz=utc) + timedelta(hours=offset)

            else:
                time = datetime.now(tz=utc) + timedelta(hours=offset, days=2)

        else:
            if (datetime.now(tz=utc) + timedelta(hours=offset)).hour < 15:
                time = datetime.now(tz=utc) + timedelta(hours=offset)

            else:
                time = datetime.now(tz=utc) + timedelta(hours=offset, days=1)

    else:
        time = datetime.now(tz=utc) + timedelta(hours=offset)

    if typeDate == 'day':
        return str(time.day)

    elif typeDate == 'month':
        return str(time.month)

    elif typeDate == 'year':
        return str(time.year)


def coloring(mood=None):
    if mood == "Good":
        return "teal"

    elif (mood == "Average") or (mood == "О"):
        return "#FF5722"

    elif (mood == "Bad") or (mood == "Н"):
        return "red"

    elif (mood == "Б") or (mood == "П"):
        return "#01579B"

    else:
        return "#212121"


def kaomoji(mood=None):
    if mood == "Good":
        return "<br>( ˙꒳​˙ )"

    elif mood == "Average":
        return "<br>(--_--)"

    elif mood == "Bad":
        return "<br>(・・ )"

    else:
        return "ヽ(ー_ー )ノ"

'''
Template handling
'''


@app.route("/up", methods=['GET'])
def up():
    s = CacheControl(Session())
    s.mount('http://', HTTPAdapter(max_retries=5))
    s.mount('https://', HTTPAdapter(max_retries=5))

    response = s.head("https://api.dnevnik.ru/")
    if response.status_code == codes.ok:
        return jsonify("Online."), 200
    
    else:
        return jsonify("Offline."), 400


@app.route("/push", methods=['POST'])
def push():
    subscription_info = loads(request.get_json()['pushSettings'])
    access_token = request.cookies.get('AccessToken', '')
    if not access_token or not subscription_info:
        return jsonify("Finished")

    recent_marks = redis_storage.get(f"{access_token}_marks")
    redis_storage.delete(f"{access_token}_marks")

    if not recent_marks:
        return jsonify("Finished")

    data = f"Оценок за сегодня: {int(recent_marks)}"

    webpush(subscription_info=subscription_info, data=data, vapid_private_key=environ.get("PushPrivate"), vapid_claims={"sub": "mailto:limitedeternity@github.io"})
    return jsonify('Success')


@app.route("/", methods=['GET'])
def index():
    response = make_response(redirect("/home"))
    return response


@app.route("/home", methods=['GET'])
def home():
    response = make_response(render_template('index.html'))
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000'
    return response


@app.route("/main", methods=['GET'])
def main():
    if 'AccessToken' in request.cookies:
        s = CacheControl(Session())
        s.mount('http://', HTTPAdapter(max_retries=5))
        s.mount('https://', HTTPAdapter(max_retries=5))

        offline = False

        try:
            access_token = request.cookies.get('AccessToken', '')
            res_userdata = s.get(f"https://api.dnevnik.ru/v1/users/me/context?access_token={access_token}")
            if res_userdata.status_code != 200:
                user_data = {}
                raise ConnectionError

            else:
                try:
                    user_data = res_userdata.json()

                except ValueError:
                    raise ConnectionError

        except ConnectionError:
            offline = True

        if not offline:
            if 'apiRequestLimit' in user_data.values() or 'parameterInvalid' in user_data.values() or 'invalidToken' in user_data.values():
                response = make_response(redirect("/logout"))
                return response

        response = make_response(render_template('index_logged_in.html'))

    else:
        response = make_response(redirect("/home"))

    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000'
    return response


@app.route("/feed", methods=['POST'])
def feed():
    if 'AccessToken' in request.cookies:
        s = CacheControl(Session())
        s.mount('http://', HTTPAdapter(max_retries=5))
        s.mount('https://', HTTPAdapter(max_retries=5))

        offline = False

        try:
            access_token = request.cookies.get('AccessToken')
            res_userdata = s.get(f"https://api.dnevnik.ru/v1/users/me/context?access_token={access_token}")
            if res_userdata.status_code != 200:
                user_data = {}
                raise ConnectionError

            else:
                try:
                    user_data = res_userdata.json()

                except ValueError:
                    raise ConnectionError

        except ConnectionError:
            offline = True

        if offline or 'apiServerError' in user_data.values():
            user = "товарищ ☭"
            school = "1337"
            feed = (("Упс...", coloring(), "Дневник.ру оффлайн", "¯\_(ツ)_/¯", "1337"))

        elif 'apiRequestLimit' in user_data.values() or 'parameterInvalid' in user_data.values() or 'invalidToken' in user_data.values():
            response = make_response(redirect("/logout"))
            return response

        else:
            user = user_data['firstName']
            school = user_data['schools'][0]['id']
            feed = []

        html_out = [f'<h4>Здравствуйте, {user}!</h4>']
        offset = int(request.cookies.get('Offset', '3'))

        day = str(timeDate('day', offset=offset, feed=True))
        month = str(timeDate('month', offset=offset, feed=True))
        day = f"0{day}" if match(r"^\d{1}$", day) else day
        month = f"0{month}" if match(r"^\d{1}$", month) else month
        year = str(timeDate('year', offset=offset, feed=True))

        if not feed:
            res_userfeed = s.get(f"https://api.dnevnik.ru/mobile/v2/feed/?date={year}-{month}-{day}&limit=1&personId={user_data['personId']}&groupId={user_data['eduGroups'][0]['id_str']}&access_token={access_token}")

            recent_data = res_userfeed.json()['Feed']['Days'][1]['MarkCards']

            redis_storage.set(f"{access_token}_marks", len(recent_data))

            for card in recent_data:
                for value in card['Values']:
                    feed.append((value['Value'], coloring(value['Mood']), card["Subject"]["Name"], card["WorkType"]["Kind"], card["LessonId"]))

        if feed:
            html_out.append('<ul class="mdl-list" style="width: 300px;">')
            for item in feed:
                html_out.append(f'<li class="mdl-list__item mdl-list__item--two-line"><span class="mdl-list__item-primary-content"><i class="material-icons mdl-list__item-avatar">info</i><span style="color:{item[1]}">{item[0]}</span><span class="mdl-list__item-sub-title">{item[2]} - {item[3]}</span></span><span class="mdl-list__item-secondary-content"><a class="mdl-list__item-secondary-action" href="https://schools.dnevnik.ru/lesson.aspx?school={school}&lesson={item[4]}" target="_blank" rel="noopener"><i class="material-icons">label</i></a></span></li>')

            html_out.append("</ul>")

        else:
            html_out.append('Спасибо, что решили протестировать beta-версию DnevnikClient. Я очень это ценю. <br>Обо всех ошибках просьба сообщать, открывая Issue в <a href="https://github.com/limitedeternity/dnevnik-client/" target="_blank" rel="noopener">репозитории на GitHub</a>. <br>Надеюсь, вам нравится клиент, и вы довольны его функционалом и проделанной мной работой. <br>Напоминаю, что проект - Open Source, так что вы в любой момент можете помочь разработке. <br>By <a href="https://github.com/limitedeternity/" target="_blank" rel="noopener">@limitedeternity</a>')

        return make_response(jsonify(''.join(html_out)))

    else:
        response = make_response(redirect("/home"))
        return response


@app.route("/stats", methods=['POST'])
def stats():
    if 'AccessToken' in request.cookies:
        s = CacheControl(Session())
        s.mount('http://', HTTPAdapter(max_retries=5))
        s.mount('https://', HTTPAdapter(max_retries=5))

        try:
            access_token = request.cookies.get('AccessToken')
            res_userdata = s.get(f"https://api.dnevnik.ru/v1/users/me/context?access_token={access_token}")
            if res_userdata.status_code != 200:
                user_data = {}
                raise ConnectionError

            else:
                try:
                    user_data = res_userdata.json()

                except ValueError:
                    raise ConnectionError

            if 'apiServerError' in user_data.values():
                raise ConnectionError

            elif 'apiRequestLimit' in user_data.values() or 'parameterInvalid' in user_data.values() or 'invalidToken' in user_data.values():
                response = make_response(redirect("/logout"))
                return response

        except ConnectionError:
            html_out = '<h4 class="mdl-cell mdl-cell--12-col">Статистика</h4><div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone"><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i></div><div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone"><h5>Данные не получены ¯\_(ツ)_/¯</h5>Кажется, Дневник.Ру ушел в оффлайн :> <br>Если вы сумели успешно запросить данные ранее, то отключитесь от сети.</div>'

            response = make_response(jsonify(html_out))
            return response

        res_marks = s.get(f"https://api.dnevnik.ru/mobile/v2/allMarks?personId={user_data['personId']}&groupId={user_data['eduGroups'][0]['id_str']}&access_token={access_token}")

        marks_data = res_marks.json()["AllMarks"]

        html_out = ['<h4 class="mdl-cell mdl-cell--12-col">Статистика</h4>']

        for markData in marks_data:
            for subjectData in markData["SubjectMarks"]:
                markCollection = []

                html_out.append('<div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone"><div style="display:block; height:2px; clear:both;"></div><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;">format_list_bulleted</i></div><div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone"><div style="display:block; height:2px; clear:both;"></div>')
                html_out.append(f'<h5 style="font-weight:600">{subjectData["Name"]}</h5>')

                for mark in subjectData["Marks"]:
                    for item in mark["Values"]:
                        markCollection.append((item["Value"], item["Mood"]))

                markCollectionCounted = (*Counter(sorted(markCollection)).items(),)[::-1]
                markSum = 0
                markTotal = len(markCollection)

                for markTuple in markCollectionCounted:
                    try:
                        html_out.append(f'<h8 style="color:{coloring(markTuple[0][1])};">{markTuple[0][0]}: {markTuple[1]}</h8><br>')

                        if len(markTuple[0][0]) > 1:
                            tempMark = int(markTuple[0][0][0]) + (0.5 if markTuple[0][0][1] == "+" else -0.5)
                        
                        else:
                            tempMark = int(markTuple[0][0][0])

                        markSum += tempMark * int(markTuple[1])

                    except (KeyError, IndexError):
                        continue

                try:
                    html_out.append(f'<h8 style="color:{coloring()};">Среднее значение: {round(markSum / markTotal, 2)}</h8><br>')

                except ZeroDivisionError:
                    html_out.append(f'<h8 style="color:{coloring()};">Среднее значение: n/a</h8><br>')

                try:
                    html_out.append(f'<h8 style="color:{coloring(subjectData["FinalMark"]["Values"][0]["Mood"])};">Итоговое значение: {subjectData["FinalMark"]["Values"][0]["Value"]}</h8><br>')

                except (KeyError, IndexError, TypeError):
                    pass

                html_out.append('<div style="display:block; height:5px; clear:both;"></div></div>')

        response = make_response(jsonify(''.join(html_out)))
        return response

    else:
        response = make_response(redirect("/home"))
        return response


@app.route("/dnevnik", methods=['POST'])
def dnevnik():
    if 'AccessToken' in request.cookies:
        s = CacheControl(Session())
        s.mount('http://', HTTPAdapter(max_retries=5))
        s.mount('https://', HTTPAdapter(max_retries=5))

        timeMonth = request.get_json().get('month', '')
        timeDay = request.get_json().get('day', '')

        offset = int(request.cookies.get('Offset', '3'))

        try:
            access_token = request.cookies.get('AccessToken')
            res_userdata = s.get(f"https://api.dnevnik.ru/v1/users/me/context?access_token={access_token}")
            if res_userdata.status_code != 200:
                user_data = {}
                raise ConnectionError

            else:
                try:
                    user_data = res_userdata.json()

                except ValueError:
                    raise ConnectionError

            if 'apiServerError' in user_data.values():
                raise ConnectionError

            elif 'apiRequestLimit' in user_data.values() or 'parameterInvalid' in user_data.values() or 'invalidToken' in user_data.values():
                response = make_response(redirect("/logout"))
                return response

        except ConnectionError:
            html_out = '<h4 class="mdl-cell mdl-cell--12-col">Дневник</h4><div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone"><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i></div><div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone"><h5>Данные не получены ¯\_(ツ)_/¯</h5>Кажется, Дневник.Ру ушел в оффлайн :> <br>Если вы сумели успешно запросить данные ранее, то отключитесь от сети.</div>'

            response = make_response(jsonify(html_out))
            return response

        if not timeDay:
            day = str(timeDate('day', offset=offset))

        else:
            day = timeDay

        if not timeMonth:
            month = str(timeDate('month', offset=offset))

        else:
            month = timeMonth

        year = str(timeDate('year', offset=offset))

        day = f"0{day}" if match(r"^\d{1}$", day) else day
        month = f"0{month}" if match(r"^\d{1}$", month) else month

        school = user_data['schools'][0]['id']
        res_lessons = s.get(f"https://api.dnevnik.ru/mobile/v2/schedule?startDate={year}-{month}-{day}&endDate={year}-{month}-{day}&personId={user_data['personId']}&groupId={user_data['eduGroups'][0]['id_str']}&access_token={access_token}")

        lesson_data = res_lessons.json()['Days'][0]['Schedule']

        if not lesson_data:
            html_out = '<h4 class="mdl-cell mdl-cell--12-col">Дневник</h4><div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone"><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i></div><div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone"><h5>Упс...</h5>Уроков нет. Вот незадача :></div>'

            response = make_response(jsonify(html_out))
            return response

        html_out = ['<h4 class="mdl-cell mdl-cell--12-col">Дневник</h4>']
        for index, lesson in enumerate(lesson_data):
            try:
                lesson_name = lesson["Subject"]["Name"]
                lesson_id = lesson["LessonId"]

            except (KeyError, TypeError):
                continue

            html_out.append('<div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone"><div style="display:block; height:2px; clear:both;"></div><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;">format_list_bulleted</i></div><div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone"><div style="display:block; height:2px; clear:both;"></div>')

            html_out.append(f'<a href="https://schools.dnevnik.ru/lesson.aspx?school={school}&lesson={lesson_id}" target="_blank" rel="noopener"><h5 style="font-weight:600">#{index}. {lesson_name}</h5></a>')

            for mark in lesson['Marks']:
                if mark:
                    if mark["MarkType"] == 'LogEntry':
                        html_out.append(f'<h8 style="color:{coloring(mark["Values"][0]["Value"])};">Присутствие: {mark["MarkTypeText"]}.</h8><br>')

                    elif mark["MarkType"] == "Mark":
                        if len(mark['Values']) > 1:
                            html_out.append('<div style="display:block; height:2px; clear:both;"></div>')

                        for markValue in mark['Values']:
                            html_out.append(f'<h8 style="color:{coloring(markValue["Mood"])};">Оценка: {markValue["Value"]} ({mark["MarkTypeText"]}) {kaomoji(markValue["Mood"])}</h8><br>')

                        if len(mark['Values']) > 1:
                            html_out.append('<div style="display:block; height:2px; clear:both;"></div>')

            if lesson["Theme"]:
                try:
                    html_out.append(f'<h8 style="color:{coloring()};">Урок: {lesson["Theme"]} ({lesson["ImportantWorks"][0]["WorkType"]})</h8><br>')

                except (KeyError, IndexError):
                    html_out.append(f'<h8 style="color:{coloring()};">Урок: {lesson["Theme"]}</h8><br>')

            else:
                pass

            if lesson["HomeworksText"]:
                hw = lesson["HomeworksText"]
                links = (*set(findall(r"http[s]?:\/\/(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+", hw)),)

                for link in links:
                    hw = hw.replace(link, f'<a href="{link}" target="_blank" rel="noopener">[ссылка]</a>')

                html_out.append(f'<h8 style="color:{coloring()};">Д/З: {hw}</h8><br>')
            
            else:
                html_out.append(f'<h8 style="color:{coloring()};">Д/З: нет {kaomoji()}</h8><br>')

            html_out.append('<div style="display:block; height:5px; clear:both;"></div></div>')

        response = make_response(jsonify(''.join(html_out)))
        return response

    else:
        response = make_response(redirect("/home"))
        return response


@app.route("/login", methods=['GET'])
def log_in():
    s = CacheControl(Session())
    s.mount('http://', HTTPAdapter(max_retries=5))
    s.mount('https://', HTTPAdapter(max_retries=5))

    try:
        access_token = request.cookies.get('AccessToken_Temp', '')
        res_userdata = s.get(f"https://api.dnevnik.ru/v1/users/me/context?access_token={access_token}")
        if res_userdata.status_code != 200:
            user_data = {}
            raise ConnectionError

        else:
            try:
                user_data = res_userdata.json()

            except ValueError:
                raise ConnectionError

        if 'apiServerError' in user_data.values() or 'parameterInvalid' in user_data.values() or 'invalidToken' in user_data.values():
            raise ConnectionError

    except ConnectionError:
        response = make_response(redirect("/home"))
        response.set_cookie('AccessToken_Temp', value='', max_age=0, expires=0)
        return response

    try:
        type_block = user_data['roles']

    except KeyError:
        response = make_response(redirect("/home"))
        response.set_cookie('AccessToken_Temp', value='', max_age=0, expires=0)
        return response

    if "EduStudent" not in type_block:
        return jsonify("Тип аккаунта не поддерживается. Ну не хочу я :c")

    response = make_response(redirect("/home"))
    response.set_cookie('AccessToken_Temp', value='', max_age=0, expires=0)
    response.set_cookie('AccessToken', value=access_token, max_age=2592000, expires=2592000, secure=True)
    return response


@app.route("/apply", methods=['POST'])
def apply():
    color = request.get_json().get('color', '')

    if color not in ("Teal", "Deep Orange", "Deep Purple", "Pink"):
        html_out = '<div style="display:block; height:2px; clear:both;"></div><p style="text-align:center; color:red;">Кто-то против смены темы c:</p>'
        return make_response(jsonify(html_out))

    html_out = '<div style="display:block; height:2px; clear:both;"></div><p style="text-align:center; color:green;">Смена цветовой схемы успешна ^^</p>'
    response = make_response(jsonify(html_out))
    response.set_cookie('Theme', value=color, max_age=2592000, expires=2592000, secure=True)
    return response


@app.route("/logout", methods=['GET'])
def log_out():
    s = CacheControl(Session())
    s.mount('http://', HTTPAdapter(max_retries=5))
    s.mount('https://', HTTPAdapter(max_retries=5))

    offline = False

    try:
        access_token = request.cookies.get('AccessToken', '')
        res_userdata = s.get(f"https://api.dnevnik.ru/v1/users/me/context?access_token={access_token}")
        if res_userdata.status_code != 200:
            user_data = {}
            raise ConnectionError

        else:
            try:
                user_data = res_userdata.json()

            except ValueError:
                raise ConnectionError

        if 'apiServerError' in user_data.values():
            raise ConnectionError

    except ConnectionError:
        offline = True

    response = make_response(redirect("/home"))

    if 'AccessToken' in request.cookies and not offline:
        redis_storage.delete(f"{access_token}_marks")
        response.set_cookie('AccessToken', value='', max_age=0, expires=0)
        response.set_cookie('Offset', value='', max_age=0, expires=0)

    return response


@app.route('/sw.js', methods=['GET'])
def serviceworker():
    response = make_response(send_from_directory('static/js/serviceworker', 'sw.js'))
    response.headers['Cache-Control'] = 'no-cache, max-age=0'
    return response


if __name__ == "__main__":
    chdir(dirname(abspath(__file__)))
    app.run(debug=debug, use_reloader=True)
