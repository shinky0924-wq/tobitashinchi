import os
import shutil
import subprocess
import sys
import zipfile

def create_zip_from_dir(dir_path, zip_path):
    print(f"  -> Creating {zip_path} from folder {dir_path}...")
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for root, dirs, files in os.walk(dir_path):
            # Sort for determinism
            dirs.sort()
            files.sort()
            
            # Create directory entries
            for d in dirs:
                full_dir_path = os.path.join(root, d)
                rel_dir_path = os.path.relpath(full_dir_path, dir_path)
                rel_dir_path = rel_dir_path.replace(os.path.sep, '/') + '/'
                
                info = zipfile.ZipInfo(rel_dir_path)
                # UNIX directory permissions 755
                info.external_attr = (0o40755 << 16) | 0x10
                zip_file.writestr(info, '')
                
            # Create file entries
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, dir_path)
                rel_path = rel_path.replace(os.path.sep, '/')
                
                info = zipfile.ZipInfo(rel_path)
                # UNIX file permissions 644
                info.external_attr = (0o100644 << 16)
                info.compress_type = zipfile.ZIP_DEFLATED
                
                with open(full_path, 'rb') as f:
                    zip_file.writestr(info, f.read())

def create_source_zip(root_dir, zip_path, exclude_list):
    print(f"  -> Creating {zip_path} for source code in {root_dir}...")
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for root, dirs, files in os.walk(root_dir):
            # Exclude folders
            dirs[:] = [d for d in dirs if d not in exclude_list]
            dirs.sort()
            files.sort()
            
            # Create directory entries
            for d in dirs:
                full_dir_path = os.path.join(root, d)
                rel_dir_path = os.path.relpath(full_dir_path, root_dir)
                rel_dir_path = rel_dir_path.replace(os.path.sep, '/') + '/'
                
                info = zipfile.ZipInfo(rel_dir_path)
                # UNIX directory permissions 755
                info.external_attr = (0o40755 << 16) | 0x10
                zip_file.writestr(info, '')
                
            # Create file entries
            for file in files:
                if file in exclude_list:
                    continue
                
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, root_dir)
                rel_path = rel_path.replace(os.path.sep, '/')
                
                # Check segments for safety
                segments = rel_path.split('/')
                if any(seg in exclude_list for seg in segments):
                    continue
                    
                info = zipfile.ZipInfo(rel_path)
                # UNIX file permissions 644
                info.external_attr = (0o100644 << 16)
                info.compress_type = zipfile.ZIP_DEFLATED
                
                with open(full_path, 'rb') as f:
                    zip_file.writestr(info, f.read())

def main():
    root_dir = os.getcwd()
    public_dir = os.path.join(root_dir, 'public')
    dist_dir = os.path.join(root_dir, 'dist')
    
    if not os.path.exists(public_dir):
        os.makedirs(public_dir, exist_ok=True)
        print("📁 Created public directory.")
        
    release_zip_name = 'tobita-girls-website-release.zip'
    source_zip_name = 'tobita-girls-source-code.zip'
    
    root_release_zip = os.path.join(root_dir, release_zip_name)
    root_source_zip = os.path.join(root_dir, source_zip_name)
    public_release_zip = os.path.join(public_dir, release_zip_name)
    public_source_zip = os.path.join(public_dir, source_zip_name)
    
    # 1. Delete old ZIP files
    for p in [root_release_zip, root_source_zip, public_release_zip, public_source_zip]:
        if os.path.exists(p):
            os.remove(p)
            print(f"🗑️ Removed old ZIP: {p}")
            
    # 2. Run initial production build
    print("📦 1. Running initial production build to generate dist folder...")
    try:
        subprocess.run(["npm", "run", "build"], check=True)
        print("✅ Initial build successful.")
    except subprocess.CalledProcessError as e:
        print(f"❌ Build failed: {e}")
        sys.exit(1)
        
    # 3. Create release ZIP from dist folder
    print("📦 2. Creating release ZIP...")
    if os.path.exists(dist_dir):
        create_zip_from_dir(dist_dir, root_release_zip)
        shutil.copy2(root_release_zip, public_release_zip)
        print(f"✅ Release ZIP created: {root_release_zip} & {public_release_zip}")
    else:
        print("❌ Error: dist folder does not exist.")
        sys.exit(1)
        
    # 4. Create source ZIP
    print("📦 3. Creating source ZIP...")
    exclude_list = [
        'node_modules',
        'dist',
        '.git',
        '.github',
        release_zip_name,
        source_zip_name,
        '.DS_Store'
    ]
    create_source_zip(root_dir, root_source_zip, exclude_list)
    shutil.copy2(root_source_zip, public_source_zip)
    print(f"✅ Source ZIP created: {root_source_zip} & {public_source_zip}")
    
    # 5. Run final build to bundle everything
    print("📦 4. Running final production build to embed ZIPs...")
    try:
        subprocess.run(["npm", "run", "build"], check=True)
        print("✅ Final build completed. ZIP files are fully bundled and downloadable.")
    except subprocess.CalledProcessError as e:
        print(f"❌ Final build failed: {e}")
        sys.exit(1)
        
    print("\n🎉 All ZIP files generated successfully with perfect permissions!")

if __name__ == '__main__':
    main()
