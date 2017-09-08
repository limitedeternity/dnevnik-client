# -*- coding: utf-8 -*-

from flask import Flask, render_template, make_response, send_from_directory, request, redirect, jsonify
from random import choice
from requests import Session
from datetime import datetime
import pandas as pd
from urllib.parse import urlparse, parse_qs
from os import chdir
from json import loads
from os.path import dirname, abspath
from flask_wtf.csrf import CSRFProtect
from waitress import serve
from os import environ
from sys import argv
from cachecontrol import CacheControl
from base64 import b64encode, b64decode


app = Flask(__name__, template_folder='templates')
app.config['SECRET_KEY'] = environ.get("SECRET_KEY", "".join(choice("abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)") for _ in range(50)))
app.config['REMEMBER_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_SECURE'] = True
csrf = CSRFProtect(app)


'''
Required functionality
'''


def timeDate(typeDate, timeMonth=None, timeDay=None):

    if typeDate == 'day':
        return str(datetime.today().day)

    elif typeDate == 'month':
        return str(datetime.today().month)

    elif typeDate == 'year':
        return str(datetime.today().year)

    elif typeDate == 'weekday':
        return str(datetime(int(timeDate('year')), int(timeMonth), int(timeDay)).weekday())


def schoolId(s):

    return str(parse_qs(urlparse(s.get("https://schools.dnevnik.ru/school.aspx").url).query)['school'][-1])


'''
Template handling
'''


@app.route("/", methods=['GET'])
def index():
    if 'DnevnikLogin' not in request.cookies:
        response = make_response(render_template('index.html'))

    else:
        response = make_response(render_template('index_logged_in.html'))

    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response


@app.route("/stats", methods=['POST'])
def stats():
    if 'DnevnikLogin' in request.cookies:
        s = CacheControl(Session())

        s.headers.update({'Upgrade-Insecure-Requests': '1',
                          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36',
                          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                          'DNT': '1',
                          'Accept-Encoding': 'gzip, deflate, br',
                          'Accept-Language': 'ru-RU,en-US;q=0.8,ru;q=0.6,en;q=0.4'})

        login_payload = {'login': b64decode(request.cookies.get('DnevnikLogin').encode('ascii')).decode("utf-8").replace('"', ''),
                         'password': b64decode(request.cookies.get('DnevnikPass').encode('ascii')).decode("utf-8").replace('"', ''),
                         'exceededAttempts': 'False', 'ReturnUrl': ''}

        s.post('https://login.dnevnik.ru/login', login_payload)
        s.get('https://dnevnik.ru/')

        data = s.get("https://schools.dnevnik.ru/marks.aspx?school=" + schoolId(s) + "&index=-1&tab=stats&period=" + (str(termPeriod) if termPeriod is not None else "0")).content
        tables = pd.read_html(data)[-1]
        return tables.to_json(force_ascii=False)

    else:
        html_out = ""

        html_out += '<h4 class="mdl-cell mdl-cell--12-col">Залогинься ¯\_(ツ)_/¯</h4>'

        return jsonify(html_out)


@app.route("/summary", methods=['POST'])
def summary():
    if 'DnevnikLogin' in request.cookies:
        s = CacheControl(Session())

        s.headers.update({'Upgrade-Insecure-Requests': '1',
                          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36',
                          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                          'DNT': '1',
                          'Accept-Encoding': 'gzip, deflate, br',
                          'Accept-Language': 'ru-RU,en-US;q=0.8,ru;q=0.6,en;q=0.4'})

        login_payload = {'login': b64decode(request.cookies.get('DnevnikLogin').encode('ascii')).decode("utf-8").replace('"', ''),
                         'password': b64decode(request.cookies.get('DnevnikPass').encode('ascii')).decode("utf-8").replace('"', ''),
                         'exceededAttempts': 'False', 'ReturnUrl': ''}

        s.post('https://login.dnevnik.ru/login', login_payload)
        s.get('https://dnevnik.ru/')

        try:
            data = s.get("https://schools.dnevnik.ru/marks.aspx?school=" + schoolId(s) + "&index=-1&tab=result").content
            tables = pd.read_html(data)[-1]
            return tables.to_json(force_ascii=False)

        except (ValueError, IndexError):
            html_out = ""

            html_out += '<h4 class="mdl-cell mdl-cell--12-col">Данных нет ¯\_(ツ)_/¯</h4>'

            return jsonify(html_out)

    else:
        html_out = ""

        html_out += '<h4 class="mdl-cell mdl-cell--12-col">Залогиньтесь ¯\_(ツ)_/¯</h4>'

        return jsonify(html_out)


@app.route("/dnevnik", methods=['POST'])
def dnevnik():
    if 'DnevnikLogin' in request.cookies:
        s = CacheControl(Session())

        timeMonth = request.form.get('month', None)
        timeDay = request.form.get('day', None)

        s.headers.update({'Upgrade-Insecure-Requests': '1',
                          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36',
                          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                          'DNT': '1',
                          'Accept-Encoding': 'gzip, deflate, br',
                          'Accept-Language': 'ru-RU,en-US;q=0.8,ru;q=0.6,en;q=0.4'})

        login_payload = {'login': b64decode(request.cookies.get('DnevnikLogin').encode('ascii')).decode("utf-8").replace('"', ''),
                         'password': b64decode(request.cookies.get('DnevnikPass').encode('ascii')).decode("utf-8").replace('"', ''),
                         'exceededAttempts': 'False', 'ReturnUrl': ''}

        s.post('https://login.dnevnik.ru/login', login_payload)
        s.get('https://dnevnik.ru/')

        data = s.get("https://schools.dnevnik.ru/marks.aspx?school=" + schoolId(s) + "&index=-1&tab=week&year=" + timeDate('year') + "&month=" + (str(timeMonth) if timeMonth is not None else timeDate('month')) + "&day=" + (timeDate('day') if timeDay is None and timeMonth is None else str(timeDay) if timeDate('weekday', str(timeMonth), str(timeDay)) != '6' else str(int(timeDay) - 1))).content

        columns = {0: 'Уроки', 1: 'Присутствие', 2: 'Оценки', 3: 'Замечания', 4: 'ДЗ'}
        tables = None
        swapped = False

        try:
            if timeDate('weekday', str(timeMonth), str(timeDay)) != '6':
                tables = pd.read_html(data)[int(timeDate('weekday', timeMonth, timeDay))].rename(columns=columns)

            else:
                tables = pd.read_html(data)[int(timeDate('weekday', timeMonth, timeDay)) - 1].rename(columns=columns)

        except (ValueError, IndexError):
            html_out = ""

            html_out += '<div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone">'
            html_out += '<div class="section__circle-container__circle mdl-color--primary"></div>'
            html_out += '</div>'
            html_out += '<div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone">'
            html_out += '<h5>Уроков нет ¯\_(ツ)_/¯</h5>'
            html_out += 'Наслаждайтесь временно отсутствующим расписанием :>'
            html_out += '</div>'

            return jsonify(html_out)

        if not str(tables['Уроки'][0]).startswith("!"):
            tables.index = range(1, len(tables) + 1)
            swapped = True

        tables['Уроки'] = tables['Уроки'].apply(lambda x: str(x)[:-6])

        json_out = loads(tables.to_json(force_ascii=False))

        html_out = ""

        html_out += '<h4 class="mdl-cell mdl-cell--12-col">Дневник</h4>'
        for i in range(len(json_out['Уроки'])):
            if not swapped:
                html_out += '<div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone">'
                html_out += '<div class="section__circle-container__circle mdl-color--primary"></div>'
                html_out += '</div>'
                html_out += '<div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone">'
                html_out += '<h5>' + str(json_out['Уроки'][str(i)]) + '</h5>'
                html_out += 'Присутствие: ' + ("отмечено." if str(json_out["Присутствие"][str(i)]) == 'None' else str(json_out["Присутствие"][str(i)])) + "<br>" + "Оценка: " + ("нет." if str(json_out["Оценки"][str(i)]) == 'None' else str(int(float(json_out["Оценки"][str(i)])))) + "<br>" + "Замечания: " + ("нет." if str(json_out["Замечания"][str(i)]) == 'None' else str(json_out["Замечания"][str(i)])) + "<br>" + "ДЗ: " + ("нет." if str(json_out["ДЗ"][str(i)]) == 'None' else str(json_out["ДЗ"][str(i)])) + "<br>"
                html_out += '</div>'

            elif swapped:
                html_out += '<div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone">'
                html_out += '<div class="section__circle-container__circle mdl-color--primary"></div>'
                html_out += '</div>'
                html_out += '<div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone">'
                html_out += '<h5>' + str(json_out['Уроки'][str(i + 1)]) + '</h5>'
                html_out += 'Присутствие: ' + ("отмечено." if str(json_out["Присутствие"][str(i + 1)]) == 'None' else str(json_out["Присутствие"][str(i + 1)])) + "<br>" + "Оценка: " + ("нет." if str(json_out["Оценки"][str(i + 1)]) == 'None' else str(int(float(json_out["Оценки"][str(i + 1)])))) + "<br>" + "Замечания: " + ("нет." if str(json_out["Замечания"][str(i + 1)]) == 'None' else str(json_out["Замечания"][str(i + 1)])) + "<br>" + "ДЗ: " + ("нет." if str(json_out["ДЗ"][str(i + 1)]) == 'None' else str(json_out["ДЗ"][str(i + 1)])) + "<br>"
                html_out += '</div>'

        return jsonify(html_out)

    else:
        html_out += '<div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone">'
        html_out += '<div class="section__circle-container__circle mdl-color--primary"></div>'
        html_out += '</div>'
        html_out += '<div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone">'
        html_out += '<h5>Залогиньтесь ¯\_(ツ)_/¯</h5>'
        html_out += 'Вы явно такого не ожидали, не правда ли?'
        html_out += '</div>'

        return jsonify(html_out)


@app.route("/login", methods=['POST'])
def login():
    login = request.form.get('username', None)
    password = request.form.get('password', None)
    if login is not None and password is not None:
        s = CacheControl(Session())

        s.headers.update({'Upgrade-Insecure-Requests': '1',
                          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36',
                          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                          'DNT': '1',
                          'Accept-Encoding': 'gzip, deflate, br',
                          'Accept-Language': 'ru-RU,en-US;q=0.8,ru;q=0.6,en;q=0.4'})

        login_payload = {'login': login, 'password': password,
                         'exceededAttempts': 'False', 'ReturnUrl': ''}

        s.post('https://login.dnevnik.ru/login', login_payload)
        s.get('https://dnevnik.ru/')

        try:
            s.cookies.get_dict()['DnevnikAuth_a']

        except KeyError:
            html_out = ""

            html_out += '<div style="display:block; height:2px; clear:both;"></div>'
            html_out += '<p style="text-align: center;">Данные неверны ¯\_(ツ)_/¯</p>'

            return jsonify(html_out)

        response = make_response("Вход выполнен.")

        response.set_cookie('DnevnikLogin', value=b64encode(login.encode('ascii')).decode("utf-8").replace('"', ''))
        response.set_cookie('DnevnikPass', value=b64encode(password.encode('ascii')).decode("utf-8").replace('"', ''))

        return response

    else:
        return True


@app.route("/logout", methods=['GET'])
def logout():
    response = make_response(redirect('/'))

    if 'DnevnikLogin' in request.cookies:
            response.set_cookie('DnevnikLogin', value='', max_age=0, expires=0)
            response.set_cookie('DnevnikPass', value='', max_age=0, expires=0)

    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response


'''
Frontend handling
'''


@app.route('/images/<path:path>', methods=['GET'])
def serve_images(path):
    return send_from_directory('static/images', path)


@app.route('/js/<path:path>', methods=['GET'])
def serve_js(path):
    return send_from_directory('static/js', path)


@app.route('/css/<path:path>', methods=['GET'])
def serve_css(path):
    return send_from_directory('static/css', path)


if __name__ == "__main__":
    chdir(dirname(abspath(__file__)))
    serve(app, host='0.0.0.0', port=argv[1])
