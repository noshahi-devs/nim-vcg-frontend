# Page snapshot

```yaml
- generic [ref=e5]:
  - generic [ref=e6]:
    - img "Logo" [ref=e8]
    - img "Auth Image" [ref=e9]
  - generic [ref=e11]:
    - generic [ref=e12]:
      - heading "Welcome Back" [level=1] [ref=e13]
      - paragraph [ref=e14]: Enter your details below
    - generic [ref=e15]:
      - generic [ref=e16]:
        - generic [ref=e17]: Email Address
        - generic [ref=e18]:
          - img [ref=e21]
          - textbox "admin@nimvcg.com" [ref=e25]
      - generic [ref=e26]:
        - generic [ref=e27]: Password
        - generic [ref=e28]:
          - img [ref=e31]
          - textbox "••••••••" [ref=e34]
          - img [ref=e36] [cursor=pointer]
      - generic [ref=e40]:
        - generic [ref=e41]:
          - checkbox "Remember me" [ref=e42] [cursor=pointer]
          - generic [ref=e43] [cursor=pointer]: Remember me
        - link "Forgot Password?" [ref=e44] [cursor=pointer]:
          - /url: javascript:void(0)
      - button "Sign In" [ref=e45] [cursor=pointer]:
        - img [ref=e47]
        - text: Sign In
```