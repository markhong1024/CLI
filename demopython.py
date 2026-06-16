# demopython.py

x=5
y=3.14
strA="파이썬은 강력해"
print(dir())

print("---리스트형식과 튜플, 딕셔너리 사용하기---")
lst=[10,20,30]
print(len(lst))
for item in lst:
    print(item)

tup=(10,20,30)
print(tup[0])

colors={'red':1, 'green':2, 'blue':3}
print(colors['red'])
colors["pink"]=4
print(colors)
del colors['green']
print(colors)
for item in colors.items():
    print(item)
    
