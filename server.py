# -*- coding: utf-8 -*-

from flask import Flask, render_template, make_response, send_from_directory, request, redirect
from random import choice
from requests import Session
from datetime import datetime
import pandas as pd
from urllib.parse import urlparse, parse_qs
from json import dumps
from os import chdir
from os.path import dirname, abspath
from flask_wtf.csrf import CSRFProtect
from waitress import serve
from os import environ
from sys import argv


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
    if request.method == 'GET':
        response = make_response(render_template('index.html'))
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        return response


@app.route("/dnevnik", methods=['GET', 'POST'])
def dnevnik():
    if request.method == 'GET':
        if 'DnevnikAuth_a' in request.cookies:
            response = make_response(render_template('dnevnik.html'))
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
            return response

        else:
            response = make_response(redirect('/login'))
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
            return response

    elif request.method == 'POST':
        if 'DnevnikAuth_a' in request.cookies:
            s = Session()

            timeMonth = request.form.get('month', None)
            timeDay = request.form.get('day', None)

            s.headers.update({'Upgrade-Insecure-Requests': '1',
                              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36', 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8', 'DNT': '1', 'Accept-Encoding': 'gzip, deflate, br', 'Accept-Language': 'ru-RU,en-US;q=0.8,ru;q=0.6,en;q=0.4', 'Cookie': "_ym_uid=" + request.cookies.get('_ym_uid') + '; ' + "SnapABugHistory=" + request.cookies.get('SnapABugHistory') + '; ' + "_ym_isad=" + request.cookies.get('_ym_isad') + '; ' + "dnevnik_sst=" + request.cookies.get('dnevnik_sst') + '; ' + "DnevnikAuth_a=" + request.cookies.get('DnevnikAuth_a') + '; ' + "spauth=" + request.cookies.get('spauth') + '; ' + "spvisit=" + request.cookies.get('spvisit') + '; ' + "_ga=" + request.cookies.get('_ga') + '; ' + "_gid=" + request.cookies.get('_gid') + "; " + "t0=" + request.cookies.get('t0') + "; " + "t1=" + request.cookies.get('t1') + "; " + "t2=" + request.cookies.get('t2')})

            data = s.get("https://schools.dnevnik.ru/marks.aspx?school=" + schoolId(s) + "&index=-1&tab=week&year=" + timeDate('year') + "&month=" + (str(timeMonth) if timeMonth is not None else timeDate('month')) + "&day=" + (timeDate('day') if timeDay is None and timeMonth is None else str(timeDay) if timeDate('weekday', str(timeMonth), str(timeDay)) != '6' else str(int(timeDay) - 1))).content
            columns = {0: 'Урок', 1: 'Присутствие', 2: 'Оценки', 3: 'Замечания', 4: 'ДЗ'}
            tables = None

            try:
                if timeDate('weekday', str(timeMonth), str(timeDay)) != '6':
                    tables = pd.read_html(data)[int(timeDate('weekday', timeMonth, timeDay))].rename(columns=columns)

                else:
                    tables = pd.read_html(data)[int(timeDate('weekday', timeMonth, timeDay)) - 1].rename(columns=columns)

            except (ValueError, IndexError):
                return dumps("Уроков нет ¯\_(ツ)_/¯", ensure_ascii=False)

            if not str(tables['Урок'][0]).startswith("!"):
                tables.index = range(1, len(tables) + 1)

            tables['Урок'] = tables['Урок'].apply(lambda x: str(x)[:-6])

            return tables.to_json(force_ascii=False)

        else:
            response = make_response(redirect('/login'))
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
            return response


@app.route("/stats", methods=['GET', 'POST'])
def stats():
    if request.method == 'GET':
        if 'DnevnikAuth_a' in request.cookies:
            response = make_response(render_template('stats.html'))
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
            return response

        else:
            response = make_response(redirect('/login'))
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
            return response

    elif request.method == 'POST':
        if 'DnevnikAuth_a' in request.cookies:
            s = Session()

            termPeriod = request.form.get('term', None)

            s.headers.update({'Upgrade-Insecure-Requests': '1',
                              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36', 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8', 'DNT': '1', 'Accept-Encoding': 'gzip, deflate, br', 'Accept-Language': 'ru-RU,en-US;q=0.8,ru;q=0.6,en;q=0.4', 'Cookie': "_ym_uid=" + request.cookies.get('_ym_uid') + '; ' + "SnapABugHistory=" + request.cookies.get('SnapABugHistory') + '; ' + "_ym_isad=" + request.cookies.get('_ym_isad') + '; ' + "dnevnik_sst=" + request.cookies.get('dnevnik_sst') + '; ' + "DnevnikAuth_a=" + request.cookies.get('DnevnikAuth_a') + '; ' + "spauth=" + request.cookies.get('spauth') + '; ' + "spvisit=" + request.cookies.get('spvisit') + '; ' + "_ga=" + request.cookies.get('_ga') + '; ' + "_gid=" + request.cookies.get('_gid') + "; " + "t0=" + request.cookies.get('t0') + "; " + "t1=" + request.cookies.get('t1') + "; " + "t2=" + request.cookies.get('t2')})

            data = s.get("https://schools.dnevnik.ru/marks.aspx?school=" + schoolId(s) + "&index=-1&tab=stats&period=" + (str(termPeriod) if termPeriod is not None else "0")).content
            tables = pd.read_html(data)[-1]
            return tables.to_json(force_ascii=False)

        else:
            response = make_response(redirect('/login'))
            return response


@app.route("/summary", methods=['GET', 'POST'])
def summary():
    if request.method == 'GET':
        if 'DnevnikAuth_a' in request.cookies:
            response = make_response(render_template('summary.html'))
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
            return response

        else:
            response = make_response(redirect('/login'))
            return response

    elif request.method == 'POST':
        if 'DnevnikAuth_a' in request.cookies:
            s = Session()

            s.headers.update({'Upgrade-Insecure-Requests': '1',
                              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36', 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8', 'DNT': '1', 'Accept-Encoding': 'gzip, deflate, br', 'Accept-Language': 'ru-RU,en-US;q=0.8,ru;q=0.6,en;q=0.4', 'Cookie': "_ym_uid=" + request.cookies.get('_ym_uid') + '; ' + "SnapABugHistory=" + request.cookies.get('SnapABugHistory') + '; ' + "_ym_isad=" + request.cookies.get('_ym_isad') + '; ' + "dnevnik_sst=" + request.cookies.get('dnevnik_sst') + '; ' + "DnevnikAuth_a=" + request.cookies.get('DnevnikAuth_a') + '; ' + "spauth=" + request.cookies.get('spauth') + '; ' + "spvisit=" + request.cookies.get('spvisit') + '; ' + "_ga=" + request.cookies.get('_ga') + '; ' + "_gid=" + request.cookies.get('_gid') + "; " + "t0=" + request.cookies.get('t0') + "; " + "t1=" + request.cookies.get('t1') + "; " + "t2=" + request.cookies.get('t2')})

            try:
                data = s.get("https://schools.dnevnik.ru/marks.aspx?school=" + schoolId(s) + "&index=-1&tab=result").content
                tables = pd.read_html(data)[-1]
                return tables.to_json(force_ascii=False)

            except (ValueError, IndexError):
                return dumps("Данных нет ¯\_(ツ)_/¯", ensure_ascii=False)

        else:
            response = make_response(redirect('/login'))
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
            return response


@app.route("/login", methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        if 'DnevnikAuth_a' in request.cookies:
            response = make_response(redirect('/dnevnik'))
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
            return response

        else:
            response = make_response(render_template('login.html'))
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
            return response

    elif request.method == 'POST':
        login = request.form.get('login', None)
        password = request.form.get('password', None)
        if login is not None and password is not None:
            s = Session()
            s.headers.update({'Upgrade-Insecure-Requests': '1',
                              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36', 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8', 'DNT': '1', 'Accept-Encoding': 'gzip, deflate, br', 'Accept-Language': 'ru-RU,en-US;q=0.8,ru;q=0.6,en;q=0.4'})
            login_payload = {'login': login, 'password': password,
                             'exceededAttempts': 'False', 'ReturnUrl': ''}
            s.post('https://login.dnevnik.ru/login', login_payload)
            s.get('https://dnevnik.ru/')

            try:
                s.cookies.get_dict()['DnevnikAuth_a']

            except KeyError:
                return dumps("Данные неверны ¯\_(ツ)_/¯", ensure_ascii=False)

            auth_cookies = s.cookies.get_dict()
            response = make_response(redirect('/dnevnik'))
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
            for key, value in auth_cookies.items():
                response.set_cookie(key, value=value, max_age=86400, expires=86400)

            return response


@app.route("/logout", methods=['GET'])
def logout():
    if request.method == 'GET':
        response = make_response(redirect('/'))
        response.set_cookie('DnevnikAuth_a', value='', max_age=0, expires=0)
        response.set_cookie('SnapABugHistory', value='', max_age=0, expires=0)
        response.set_cookie('_ga', value='', max_age=0, expires=0)
        response.set_cookie('_gid', value='', max_age=0, expires=0)
        response.set_cookie('_ym_isad', value='', max_age=0, expires=0)
        response.set_cookie('_ym_uid', value='', max_age=0, expires=0)
        response.set_cookie('dnevnik_sst', value='', max_age=0, expires=0)
        response.set_cookie('spauth', value='', max_age=0, expires=0)
        response.set_cookie('spvisit', value='', max_age=0, expires=0)
        response.set_cookie('t0', value='', max_age=0, expires=0)
        response.set_cookie('t1', value='', max_age=0, expires=0)
        response.set_cookie('t2', value='', max_age=0, expires=0)
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        return response


'''
Frontend handling
'''


@app.route('/config/<path:path>', methods=['GET'])
def serve_config(path):
    return send_from_directory('static/config', path)


@app.route('/js/<path:path>', methods=['GET'])
def serve_js(path):
    return send_from_directory('static/js', path)


@app.route('/css/<path:path>', methods=['GET'])
def serve_css(path):
    return send_from_directory('static/css', path)


@app.route('/images/<path:path>', methods=['GET'])
def serve_image(path):
    return send_from_directory('static/images', path)


@app.route('/fonts/<path:path>', methods=['GET'])
def serve_fonts(path):
    return send_from_directory('static/fonts', path)


if __name__ == "__main__":
    chdir(dirname(abspath(__file__)))
    serve(app, host='0.0.0.0', port=argv[1])
