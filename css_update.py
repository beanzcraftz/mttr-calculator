
with open('styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Make buttons shiny
old_btn = '''
.btn-primary {
    background: var(--primary);
    color: white;
    border: none;
}
.btn-primary:hover {
    background: var(--primary-hover);
}'''
new_btn = '''
.btn-primary {
    background: linear-gradient(135deg, var(--primary), #60a5fa);
    color: white;
    border: none;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
    transition: all 0.3s ease;
}
.btn-primary:hover {
    background: linear-gradient(135deg, var(--primary-hover), #3b82f6);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
    transform: translateY(-2px);
}'''
css = css.replace(old_btn, new_btn)

with open('styles.css', 'w', encoding='utf-8') as f:
    f.write(css)

